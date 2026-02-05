import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;

// The self-healing bug fixer agent
export const fixIssue = inngest.createFunction(
    {
        id: "fix-issue",
        name: "Fix GitHub Issue",
        retries: MAX_RETRIES,
    },
    { event: "issue/created" },
    async ({ event, step }) => {
        const {
            issueLogId,
            userId,
            issueNumber,
            repoFullName,
            apiKeyId,
        } = event.data;

        // Step 1: Update status to processing
        await step.run("update-status-processing", async () => {
            await prisma.issueLog.update({
                where: { id: issueLogId },
                data: { status: "processing" },
            });
        });

        // Step 2: Get user's access token and API key (+ HuggingFace fallback)
        const credentials = await step.run("get-credentials", async (): Promise<{
            githubToken: string;
            apiKey: string;
            provider: "openai" | "google" | "anthropic" | "huggingface";
            huggingfaceFallbackKey?: string; // For automatic fallback on rate limits
        }> => {
            const [account, apiKey, huggingfaceKey] = await Promise.all([
                prisma.account.findFirst({
                    where: { userId, provider: "github" },
                }),
                prisma.aPIKey.findUnique({
                    where: { id: apiKeyId },
                }),
                // Also fetch HuggingFace key for fallback (if exists)
                prisma.aPIKey.findFirst({
                    where: { userId, provider: "huggingface" },
                }),
            ]);

            if (!account?.access_token || !apiKey) {
                throw new Error("Missing credentials");
            }

            // Decrypt the primary API key
            const decryptedApiKey = decrypt(
                apiKey.encryptedKey,
                apiKey.iv,
                apiKey.authTag
            );

            // Decrypt HuggingFace key if available (for fallback)
            let huggingfaceFallbackKey: string | undefined;
            if (huggingfaceKey && apiKey.provider !== "huggingface") {
                huggingfaceFallbackKey = decrypt(
                    huggingfaceKey.encryptedKey,
                    huggingfaceKey.iv,
                    huggingfaceKey.authTag
                );
            }

            return {
                githubToken: account.access_token,
                apiKey: decryptedApiKey,
                provider: apiKey.provider as "openai" | "google" | "anthropic" | "huggingface",
                huggingfaceFallbackKey,
            };
        });

        // Step 3: Fetch issue and repo context
        const context = await step.run("fetch-context", async () => {
            const octokit = new Octokit({ auth: credentials.githubToken });
            const [owner, repo] = repoFullName.split("/");

            // Get issue details
            const { data: issue } = await octokit.issues.get({
                owner,
                repo,
                issue_number: issueNumber,
            });

            // Get issue comments for additional context
            const { data: comments } = await octokit.issues.listComments({
                owner,
                repo,
                issue_number: issueNumber,
                per_page: 10,
            });

            // Get repo file tree (root level)
            const { data: tree } = await octokit.repos.getContent({
                owner,
                repo,
                path: "",
            });

            const fileList = Array.isArray(tree)
                ? tree.map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.path}`).join("\n")
                : "";

            return {
                owner,
                repo,
                issueTitle: issue.title,
                issueBody: issue.body || "",
                comments: comments.map((c) => c.body).join("\n---\n"),
                fileTree: fileList,
            };
        });

        // Step 4: Query AI for fix (with automatic HuggingFace fallback on rate limits)
        const aiResponse = await step.run("query-ai", async () => {
            const prompt = buildAgentPrompt(
                repoFullName,
                context.issueTitle,
                context.issueBody,
                context.comments,
                context.fileTree
            );

            // Helper to detect rate limit errors
            const isRateLimitError = (error: unknown): boolean => {
                if (error instanceof Error) {
                    const msg = error.message.toLowerCase();
                    return msg.includes("429") ||
                        msg.includes("rate limit") ||
                        msg.includes("quota exceeded") ||
                        msg.includes("too many requests");
                }
                return false;
            };

            // Try primary provider first
            try {
                if (credentials.provider === "google") {
                    return await queryGemini(credentials.apiKey, prompt);
                } else if (credentials.provider === "openai") {
                    return await queryOpenAI(credentials.apiKey, prompt);
                } else if (credentials.provider === "huggingface") {
                    return await queryHuggingFace(credentials.apiKey, prompt);
                } else {
                    throw new Error(`Provider ${credentials.provider} not yet supported for bug fixing`);
                }
            } catch (primaryError) {
                // If rate limited and HuggingFace fallback is available, try it
                if (isRateLimitError(primaryError) && credentials.huggingfaceFallbackKey) {
                    console.log(`[GitFixer] Primary provider ${credentials.provider} hit rate limit, falling back to HuggingFace...`);
                    try {
                        return await queryHuggingFace(credentials.huggingfaceFallbackKey, prompt);
                    } catch (fallbackError) {
                        // If fallback also fails, throw a combined error
                        throw new Error(
                            `Primary provider (${credentials.provider}) rate limited. ` +
                            `HuggingFace fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
                        );
                    }
                }
                // No fallback available or not a rate limit error - rethrow original
                throw primaryError;
            }
        });

        // Step 5: Validate AI response
        await step.run("validate-response", async () => {
            if (!aiResponse.file_path || !aiResponse.code_change) {
                throw new Error("AI response missing required fields");
            }

            if (aiResponse.confidence_score < 40) {
                throw new Error(`Low confidence score: ${aiResponse.confidence_score}`);
            }
        });

        // Step 6: Fetch the file content to modify
        const fileContent = await step.run("fetch-file", async () => {
            const octokit = new Octokit({ auth: credentials.githubToken });

            try {
                const { data } = await octokit.repos.getContent({
                    owner: context.owner,
                    repo: context.repo,
                    path: aiResponse.file_path,
                });

                if ("content" in data && data.type === "file") {
                    return {
                        content: Buffer.from(data.content, "base64").toString("utf-8"),
                        sha: data.sha,
                    };
                }
                throw new Error("Not a file");
            } catch {
                // File might not exist, AI might be creating a new one
                return { content: "", sha: null };
            }
        });

        // Step 7: Create branch, commit, and PR
        const prResult = await step.run("create-pr", async () => {
            const octokit = new Octokit({ auth: credentials.githubToken });
            const branchName = `gitfixer/issue-${issueNumber}`;

            // Get repo details to find default branch
            const { data: repoData } = await octokit.repos.get({
                owner: context.owner,
                repo: context.repo,
            });
            const defaultBranch = repoData.default_branch;

            // Get default branch ref
            const { data: refData } = await octokit.git.getRef({
                owner: context.owner,
                repo: context.repo,
                ref: `heads/${defaultBranch}`,
            });

            // Check if branch already exists and delete it if so (for idempotency)
            try {
                await octokit.git.deleteRef({
                    owner: context.owner,
                    repo: context.repo,
                    ref: `heads/${branchName}`,
                });
            } catch {
                // Ignore error if branch doesn't exist
            }

            // Create new branch
            await octokit.git.createRef({
                owner: context.owner,
                repo: context.repo,
                ref: `refs/heads/${branchName}`,
                sha: refData.object.sha,
            });

            // Sanitize file path (remove leading slash)
            const filePath = aiResponse.file_path.startsWith("/")
                ? aiResponse.file_path.slice(1)
                : aiResponse.file_path;

            // Create or update file
            await octokit.repos.createOrUpdateFileContents({
                owner: context.owner,
                repo: context.repo,
                path: filePath,
                message: aiResponse.commit_message,
                content: Buffer.from(aiResponse.code_change).toString("base64"),
                branch: branchName,
                sha: fileContent.sha || undefined,
            });

            // Create PR
            const { data: pr } = await octokit.pulls.create({
                owner: context.owner,
                repo: context.repo,
                title: `🤖 ${aiResponse.commit_message}`,
                head: branchName,
                base: defaultBranch,
                body: `## 🔧 Automated Fix for Issue #${issueNumber}

**Issue:** ${context.issueTitle}

---

### 📋 Analysis

${aiResponse.analysis}

---

### 🛡️ Confidence Score: ${aiResponse.confidence_score}/100

---

*This PR was automatically generated by [GitFixer](https://github.com/gitfixer)*

Closes #${issueNumber}`,
            });

            return {
                prNumber: pr.number,
                prUrl: pr.html_url,
            };
        });

        // Step 8: Update issue log with success
        await step.run("update-status-success", async () => {
            await prisma.issueLog.update({
                where: { id: issueLogId },
                data: {
                    status: "success",
                    prNumber: prResult.prNumber,
                    prUrl: prResult.prUrl,
                },
            });
        });

        return {
            success: true,
            prNumber: prResult.prNumber,
            prUrl: prResult.prUrl,
        };
    }
);

// ============================================
// AI Provider Functions
// ============================================

/**
 * Query OpenAI GPT-4o for a bug fix
 */
async function queryOpenAI(apiKey: string, prompt: string): Promise<AIFixResponse> {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error("No response from OpenAI");
    }

    return JSON.parse(content) as AIFixResponse;
}

/**
 * Query Google Gemini 1.5 Flash for a bug fix
 */
async function queryGemini(apiKey: string, prompt: string): Promise<AIFixResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        },
    });

    const fullPrompt = `${SYSTEM_PROMPT}

${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
        throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as AIFixResponse;
}

/**
 * Query HuggingFace Inference Providers API (free tier friendly)
 * Uses fast models that won't timeout on serverless
 * Docs: https://huggingface.co/docs/api-inference/index
 */
async function queryHuggingFace(apiKey: string, prompt: string): Promise<AIFixResponse> {
    // Use Mistral-7B-Instruct - fast and reliable on free tier
    // Fallback models if this fails: "Qwen/Qwen2.5-7B-Instruct", "microsoft/Phi-3-mini-4k-instruct"
    const models = [
        "mistralai/Mistral-7B-Instruct-v0.3",
        "Qwen/Qwen2.5-7B-Instruct",
    ];

    let lastError: Error | null = null;

    for (const model of models) {
        try {
            console.log(`[GitFixer] Trying HuggingFace model: ${model}`);

            const response = await fetch(
                "https://router.huggingface.co/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            { role: "user", content: prompt }
                        ],
                        max_tokens: 4096,
                        temperature: 0.2,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                // If 504 timeout or 503 service unavailable, try next model
                if (response.status === 504 || response.status === 503 || response.status === 529) {
                    console.log(`[GitFixer] Model ${model} timed out (${response.status}), trying next...`);
                    lastError = new Error(`${model} timed out: ${response.status}`);
                    continue;
                }
                throw new Error(`HuggingFace API error (${response.status}): ${errorText.substring(0, 200)}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "";

            if (!text) {
                throw new Error("No response from HuggingFace");
            }

            // Extract JSON from response (model might include explanation before JSON)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Could not parse JSON from HuggingFace response: " + text.substring(0, 200));
            }

            // Sanitize JSON - escape control characters in string values
            // This fixes "Bad control character in string literal" errors
            let jsonStr = jsonMatch[0];

            // Replace unescaped control characters within JSON strings
            // Match string contents and escape control chars
            jsonStr = jsonStr.replace(/"([^"\\]|\\.)*"/g, (match: string) => {
                return match
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t')
                    .replace(/[\x00-\x1f]/g, (char: string) => {
                        // Escape other control characters
                        return '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
                    });
            });

            console.log(`[GitFixer] Successfully got response from ${model}`);
            return JSON.parse(jsonStr) as AIFixResponse;

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`[GitFixer] Model ${model} failed: ${lastError.message}`);
            // Continue to next model
        }
    }

    // All models failed
    throw new Error(`All HuggingFace models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

// ============================================
// Prompts
// ============================================

const SYSTEM_PROMPT = `You are GitFixer, a Principal Software Engineer and QA Architect.
Your Goal: Fix the reported issue without introducing regressions.

INSTRUCTIONS:
1. ANALYSIS:
   - Identify the root cause.
   - Explicitly state: "The bug exists because..."

2. STRATEGY:
   - Plan the fix.
   - Identify dependencies: "If I change this, what might break?"

3. EXECUTION:
   - Provide the corrected code.
   - Provide a complete file content, not a diff.

4. SAFETY CHECK (Crucial):
   - Review your own code for common regressions.
   - If you modify a function signature, note all callers that need updates.

OUTPUT FORMAT (JSON ONLY):
{
  "analysis": "The bug exists because...",
  "file_path": "path/to/file.ext",
  "code_change": "complete file content here",
  "commit_message": "fix: [detailed description]",
  "confidence_score": 0-100
}`;

interface AIFixResponse {
    analysis: string;
    file_path: string;
    code_change: string;
    commit_message: string;
    confidence_score: number;
}

function buildAgentPrompt(
    repoName: string,
    issueTitle: string,
    issueBody: string,
    comments: string,
    fileTree: string
): string {
    return `
CONTEXT:
- Repository: ${repoName}
- Issue Title: ${issueTitle}
- Issue Body: ${issueBody}

${comments ? `COMMENTS:\n${comments}` : ""}

FILE TREE:
${fileTree}

Please analyze this issue and provide a fix. Return your response as JSON.
`;
}

// Export all functions for the Inngest handler
export const functions = [fixIssue];
