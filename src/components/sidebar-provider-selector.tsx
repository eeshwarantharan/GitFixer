"use client";

import { useState, useEffect } from "react";
import { ProviderToggle } from "./provider-toggle";

type Provider = "huggingface" | "google" | "openai" | "anthropic";

interface SidebarProviderSelectorProps {
    availableProviders: Provider[];
}

export function SidebarProviderSelector({ availableProviders }: SidebarProviderSelectorProps) {
    const [currentProvider, setCurrentProvider] = useState<Provider>("huggingface");
    const [isSaving, setIsSaving] = useState(false);

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem("gitfixer-preferred-provider") as Provider | null;
        if (saved && availableProviders.includes(saved)) {
            setCurrentProvider(saved);
        } else if (availableProviders.includes("huggingface")) {
            setCurrentProvider("huggingface");
        } else if (availableProviders.length > 0) {
            setCurrentProvider(availableProviders[0]);
        }
    }, [availableProviders]);

    const handleProviderChange = async (provider: Provider) => {
        setIsSaving(true);
        setCurrentProvider(provider);
        localStorage.setItem("gitfixer-preferred-provider", provider);

        // Also save to server for use in Inngest functions
        try {
            await fetch("/api/user/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferredProvider: provider }),
            });
        } catch (error) {
            console.error("Failed to save provider preference:", error);
        }
        setIsSaving(false);
    };

    if (availableProviders.length === 0) {
        return (
            <div className="px-3 py-2 text-xs text-muted-foreground">
                No API keys configured
            </div>
        );
    }

    return (
        <div className="relative">
            <ProviderToggle
                currentProvider={currentProvider}
                availableProviders={availableProviders}
                onProviderChange={handleProviderChange}
            />
            {isSaving && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                    ...
                </span>
            )}
        </div>
    );
}
