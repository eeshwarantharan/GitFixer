"use client";

import { useState, useEffect } from "react";

type Provider = "huggingface" | "google" | "openai" | "anthropic";

interface ProviderToggleProps {
    currentProvider: Provider;
    availableProviders: Provider[];
    onProviderChange: (provider: Provider) => void;
}

const providerLabels: Record<Provider, string> = {
    huggingface: "HF (Free)",
    google: "Gemini",
    openai: "OpenAI",
    anthropic: "Claude",
};

const providerColors: Record<Provider, string> = {
    huggingface: "text-yellow-500",
    google: "text-blue-400",
    openai: "text-green-400",
    anthropic: "text-orange-400",
};

export function ProviderToggle({
    currentProvider,
    availableProviders,
    onProviderChange,
}: ProviderToggleProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-muted/50 hover:bg-muted transition-colors border border-border rounded"
            >
                <span className="text-muted-foreground">AI Model:</span>
                <span className={`font-medium ${providerColors[currentProvider]}`}>
                    {providerLabels[currentProvider]}
                </span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded shadow-lg z-50">
                    {availableProviders.map((provider) => (
                        <button
                            key={provider}
                            onClick={(e) => {
                                e.stopPropagation();
                                onProviderChange(provider);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center justify-between ${provider === currentProvider ? "bg-muted" : ""
                                }`}
                        >
                            <span className={providerColors[provider]}>
                                {providerLabels[provider]}
                            </span>
                            {provider === currentProvider && (
                                <span className="text-xs text-muted-foreground">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
