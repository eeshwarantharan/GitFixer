"use client";

import { useState } from "react";
import { saveApiKey } from "./actions";
import { EyeOpenIcon, EyeClosedIcon, CheckIcon } from "@radix-ui/react-icons";

interface APIKeyFormProps {
    provider: "openai" | "anthropic" | "google";
    hasExisting: boolean;
    placeholder: string;
}

export function APIKeyForm({ provider, hasExisting, placeholder }: APIKeyFormProps) {
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            setMessage({ type: "error", text: "API key is required" });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const result = await saveApiKey(provider, apiKey);

            if (result.success) {
                setMessage({ type: "success", text: result.message });
                setApiKey("");
            } else {
                setMessage({ type: "error", text: result.message });
            }
        } catch {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={hasExisting ? "••••••••••••••••" : placeholder}
                        className="input-retro pr-10"
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showKey ? (
                            <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                            <EyeOpenIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-retro shrink-0"
                >
                    {isLoading ? (
                        <span className="animate-pulse">...</span>
                    ) : (
                        <>
                            <CheckIcon className="w-4 h-4" />
                            {hasExisting ? "UPDATE" : "SAVE"}
                        </>
                    )}
                </button>
            </div>

            {message && (
                <p
                    className={`text-xs ${message.type === "success" ? "text-success" : "text-error"
                        }`}
                >
                    {message.text}
                </p>
            )}
        </form>
    );
}
