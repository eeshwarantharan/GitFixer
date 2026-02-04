"use client";

import { useState } from "react";
import { syncRepos } from "./actions";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

export function SyncReposButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSync = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const result = await syncRepos();

            if (result.success) {
                setMessage({ type: "success", text: result.message });
                router.refresh();
            } else {
                setMessage({ type: "error", text: result.message });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to sync repositories" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {message && (
                <span className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}>
                    {message.text}
                </span>
            )}
            <button
                onClick={handleSync}
                disabled={isLoading}
                className="btn-retro"
            >
                <ReloadIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "SYNCING..." : "SYNC REPOS"}
            </button>
        </div>
    );
}
