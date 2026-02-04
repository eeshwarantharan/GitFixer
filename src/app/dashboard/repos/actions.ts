"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

async function getOctokit(userId: string) {
    const account = await prisma.account.findFirst({
        where: {
            userId,
            provider: "github",
        },
    });

    if (!account?.access_token) {
        return null;
    }

    return new Octokit({ auth: account.access_token });
}

export async function syncRepos(): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "Not authenticated" };
        }

        const octokit = await getOctokit(session.user.id);
        if (!octokit) {
            return { success: false, message: "GitHub access token not found. Please re-authenticate." };
        }

        // Fetch all repos the user has access to
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            per_page: 100,
            sort: "updated",
        });

        // Upsert repos to database
        for (const repo of repos) {
            await prisma.repo.upsert({
                where: { githubId: repo.id },
                update: {
                    name: repo.name,
                    fullName: repo.full_name,
                },
                create: {
                    userId: session.user.id,
                    githubId: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    isWatched: false,
                },
            });
        }

        return {
            success: true,
            message: `Synced ${repos.length} repositories`,
        };
    } catch (error) {
        console.error("Failed to sync repos:", error);
        return { success: false, message: "Failed to sync repositories" };
    }
}

export async function toggleRepoWatch(
    repoId: string,
    isWatched: boolean
): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "Not authenticated" };
        }

        // Verify repo belongs to user
        const repo = await prisma.repo.findFirst({
            where: {
                id: repoId,
                userId: session.user.id,
            },
        });

        if (!repo) {
            return { success: false, message: "Repository not found" };
        }

        const octokit = await getOctokit(session.user.id);
        if (!octokit) {
            return { success: false, message: "GitHub access token not found" };
        }

        // Get the webhook URL
        const webhookUrl = process.env.NEXTAUTH_URL
            ? `${process.env.NEXTAUTH_URL}/api/webhooks/github`
            : "https://git-fixer.vercel.app/api/webhooks/github";

        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "";

        if (isWatched) {
            // Create GitHub webhook
            try {
                const [owner, repoName] = repo.fullName.split("/");

                // Check if webhook already exists
                const { data: hooks } = await octokit.repos.listWebhooks({
                    owner,
                    repo: repoName,
                });

                const existingHook = hooks.find(h => h.config.url === webhookUrl);

                if (!existingHook) {
                    // Create new webhook
                    const { data: hook } = await octokit.repos.createWebhook({
                        owner,
                        repo: repoName,
                        config: {
                            url: webhookUrl,
                            content_type: "json",
                            secret: webhookSecret,
                        },
                        events: ["issues"],
                        active: true,
                    });

                    // Store webhook ID in repo record
                    await prisma.repo.update({
                        where: { id: repoId },
                        data: {
                            isWatched: true,
                            webhookId: hook.id.toString(),
                        },
                    });
                } else {
                    // Just update the watch status
                    await prisma.repo.update({
                        where: { id: repoId },
                        data: {
                            isWatched: true,
                            webhookId: existingHook.id.toString(),
                        },
                    });
                }

                return {
                    success: true,
                    message: "Now watching repository - webhook created",
                };
            } catch (webhookError) {
                console.error("Failed to create webhook:", webhookError);
                // Still mark as watched even if webhook fails
                await prisma.repo.update({
                    where: { id: repoId },
                    data: { isWatched: true },
                });
                return {
                    success: true,
                    message: "Watching repository (webhook setup may have failed - check permissions)",
                };
            }
        } else {
            // Delete GitHub webhook
            try {
                if (repo.webhookId) {
                    const [owner, repoName] = repo.fullName.split("/");
                    await octokit.repos.deleteWebhook({
                        owner,
                        repo: repoName,
                        hook_id: parseInt(repo.webhookId),
                    });
                }
            } catch (deleteError) {
                console.error("Failed to delete webhook:", deleteError);
            }

            await prisma.repo.update({
                where: { id: repoId },
                data: {
                    isWatched: false,
                    webhookId: null,
                },
            });

            return {
                success: true,
                message: "Stopped watching repository",
            };
        }
    } catch (error) {
        console.error("Failed to toggle repo watch:", error);
        return { success: false, message: "Failed to update repository" };
    }
}
