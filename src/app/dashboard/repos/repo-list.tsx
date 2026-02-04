"use client";

import { useState } from "react";
import { toggleRepoWatch } from "./actions";

interface Repo {
    id: string;
    userId: string;
    githubId: number;
    name: string;
    fullName: string;
    isWatched: boolean;
    webhookId: number | null;
    createdAt: Date;
    updatedAt: Date;
}

interface RepoListProps {
    repos: Repo[];
}

export function RepoList({ repos }: RepoListProps) {
    return (
        <div className="card-retro">
            <table className="table-terminal">
                <thead>
                    <tr>
                        <th>Repository</th>
                        <th>Status</th>
                        <th className="text-right">Watch</th>
                    </tr>
                </thead>
                <tbody>
                    {repos.map((repo) => (
                        <RepoRow key={repo.id} repo={repo} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RepoRow({ repo }: { repo: Repo }) {
    const [isWatched, setIsWatched] = useState(repo.isWatched);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = await toggleRepoWatch(repo.id, !isWatched);
            if (result.success) {
                setIsWatched(!isWatched);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <tr>
            <td>
                <div className="flex items-center gap-2">
                    <span className="font-medium">{repo.fullName}</span>
                </div>
            </td>
            <td>
                {isWatched ? (
                    <span className="status-badge status-ok">[ WATCHING ]</span>
                ) : (
                    <span className="status-badge text-muted-foreground">[ OFF ]</span>
                )}
            </td>
            <td className="text-right">
                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`toggle-switch ${isWatched ? "active" : ""} ${isLoading ? "opacity-50" : ""}`}
                    aria-label={isWatched ? "Stop watching" : "Start watching"}
                />
            </td>
        </tr>
    );
}
