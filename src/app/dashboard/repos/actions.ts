"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

export async function syncRepos(): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "Not authenticated" };
        }

        // Get the user's GitHub access token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: "github",
            },
        });

        if (!account?.access_token) {
            return { success: false, message: "GitHub access token not found. Please re-authenticate." };
        }

        // Initialize Octokit with user's token
        const octokit = new Octokit({
            auth: account.access_token,
        });

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

        // Update watch status
        await prisma.repo.update({
            where: { id: repoId },
            data: { isWatched },
        });

        // TODO: If enabling, create GitHub webhook
        // TODO: If disabling, delete GitHub webhook

        return {
            success: true,
            message: isWatched ? "Now watching repository" : "Stopped watching repository",
        };
    } catch (error) {
        console.error("Failed to toggle repo watch:", error);
        return { success: false, message: "Failed to update repository" };
    }
}
