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

        // Step 2: Get user's access token and API key
        const credentials = await step.run("get-credentials", async (): Promise<{
            githubToken: string;
            apiKey: string;
            provider: "openai" | "google" | "anthropic";
        }> => {
            const [account, apiKey] = await Promise.all([
                prisma.account.findFirst({
                    where: { userId, provider: "github" },
                }),
                prisma.aPIKey.findUnique({
                    where: { id: apiKeyId },
                }),
            ]);

            if (!account?.access_token || !apiKey) {
                throw new Error("Missing credentials");
            }

            // Decrypt the API key
            const decryptedApiKey = decrypt(
                apiKey.encryptedKey,
                apiKey.iv,
                apiKey.authTag
            );

            return {
                githubToken: account.access_token,
                apiKey: decryptedApiKey,
                provider: apiKey.provider as "openai" | "google" | "anthropic",
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

        // Step 4: Query AI for fix (supports OpenAI and Gemini)
        const aiResponse = await step.run("query-ai", async () => {
            const prompt = buildAgentPrompt(
                repoFullName,
                context.issueTitle,
                context.issueBody,
                context.comments,
                context.fileTree
            );

            if (credentials.provider === "google") {
                // Use Gemini 2.0 Flash
                return await queryGemini(credentials.apiKey, prompt);
            } else if (credentials.provider === "openai") {
                // Use OpenAI GPT-4o
                return await queryOpenAI(credentials.apiKey, prompt);
            } else {
                throw new Error(`Provider ${credentials.provider} not yet supported for bug fixing`);
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

            // Get default branch ref
            const { data: refData } = await octokit.git.getRef({
                owner: context.owner,
                repo: context.repo,
                ref: "heads/main",
            }).catch(() =>
                octokit.git.getRef({
                    owner: context.owner,
                    repo: context.repo,
                    ref: "heads/master",
                })
            );

            // Create new branch
            await octokit.git.createRef({
                owner: context.owner,
                repo: context.repo,
                ref: `refs/heads/${branchName}`,
                sha: refData.object.sha,
            });

            // Create or update file
            await octokit.repos.createOrUpdateFileContents({
                owner: context.owner,
                repo: context.repo,
                path: aiResponse.file_path,
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
                base: "main",
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
 * Query Google Gemini 2.0 Flash for a bug fix
 */
async function queryGemini(apiKey: string, prompt: string): Promise<AIFixResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        },
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
        throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as AIFixResponse;
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
