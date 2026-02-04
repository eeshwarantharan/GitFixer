import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RepoList } from "./repo-list";
import { SyncReposButton } from "./sync-repos-button";

export default async function ReposPage() {
    const session = await auth();

    // Fetch user's repos from database
    const repos = await prisma.repo.findMany({
        where: { userId: session!.user!.id },
        orderBy: [
            { isWatched: "desc" },
            { fullName: "asc" },
        ],
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">[ REPOSITORIES ]</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Select which repositories to watch for issues
                    </p>
                </div>
                <SyncReposButton />
            </div>

            {/* Repos List */}
            {repos.length === 0 ? (
                <div className="card-retro text-center py-12">
                    <p className="text-muted-foreground mb-4">
                        No repositories found. Click &quot;Sync Repos&quot; to fetch your GitHub repositories.
                    </p>
                    <SyncReposButton />
                </div>
            ) : (
                <RepoList repos={repos} />
            )}
        </div>
    );
}
