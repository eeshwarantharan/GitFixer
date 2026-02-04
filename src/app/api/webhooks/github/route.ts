import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string | null): boolean {
    if (!signature) return false;

    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
        console.error("GITHUB_WEBHOOK_SECRET is not set");
        return false;
    }

    const expected = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex")}`;

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the raw body for signature verification
        const payload = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        const event = request.headers.get("x-github-event");

        // Verify signature
        if (!verifySignature(payload, signature)) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // Parse the payload
        const data = JSON.parse(payload);

        // Only process issue events
        if (event !== "issues") {
            return NextResponse.json({ message: "Event ignored" }, { status: 200 });
        }

        // Only process newly opened issues
        if (data.action !== "opened") {
            return NextResponse.json({ message: "Action ignored" }, { status: 200 });
        }

        // Check if repo is watched
        const repo = await prisma.repo.findUnique({
            where: { githubId: data.repository.id },
            include: {
                user: {
                    include: {
                        apiKeys: true,
                    },
                },
            },
        });

        if (!repo || !repo.isWatched) {
            return NextResponse.json(
                { message: "Repository not watched" },
                { status: 200 }
            );
        }

        // Check if user has an API key
        const apiKey = repo.user.apiKeys.find(
            (k) => k.isValid && (k.provider === "openai" || k.provider === "anthropic")
        );

        if (!apiKey) {
            console.log(`User ${repo.userId} has no valid API key`);
            return NextResponse.json(
                { message: "No valid API key configured" },
                { status: 200 }
            );
        }

        // Create issue log
        const issueLog = await prisma.issueLog.create({
            data: {
                userId: repo.userId,
                repoId: repo.id,
                issueNumber: data.issue.number,
                issueTitle: data.issue.title,
                status: "pending",
            },
        });

        // Dispatch to Inngest for async processing
        await inngest.send({
            name: "issue/created",
            data: {
                issueLogId: issueLog.id,
                repoId: repo.id,
                userId: repo.userId,
                issueNumber: data.issue.number,
                issueTitle: data.issue.title,
                issueBody: data.issue.body || "",
                repoFullName: repo.fullName,
                apiKeyId: apiKey.id,
                apiKeyProvider: apiKey.provider,
            },
        });

        return NextResponse.json({
            message: "Issue queued for processing",
            issueLogId: issueLog.id
        });

    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GitHub sends a GET request to verify the webhook
export async function GET() {
    return NextResponse.json({ status: "ok" });
}
