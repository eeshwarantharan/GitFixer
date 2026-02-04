"use client";

import { useState, useTransition } from "react";
import { setPreferredProvider, type Provider } from "./provider-actions";

const PROVIDERS: { id: Provider; name: string; icon: string }[] = [
    { id: "huggingface", name: "HF", icon: "🤗" },
    { id: "google", name: "Gemini", icon: "✨" },
    { id: "openai", name: "GPT", icon: "🧠" },
    { id: "anthropic", name: "Claude", icon: "🔮" },
];

interface ProviderSelectorProps {
    currentProvider: Provider;
}

export function ProviderSelector({ currentProvider }: ProviderSelectorProps) {
    const [selected, setSelected] = useState<Provider>(currentProvider);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleChange = (provider: Provider) => {
        if (provider === selected || isPending) return;

        setError(null);
        startTransition(async () => {
            const result = await setPreferredProvider(provider);
            if (result.success) {
                setSelected(provider);
            } else {
                setError(result.message);
                // Reset after 3 seconds
                setTimeout(() => setError(null), 3000);
            }
        });
    };

    return (
        <div className="space-y-2">
            <div className="text-xs text-muted-foreground">AI Provider</div>
            <div className="flex gap-1">
                {PROVIDERS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => handleChange(p.id)}
                        disabled={isPending}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all border ${selected === p.id
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
                        title={p.name}
                    >
                        <span className="block text-sm">{p.icon}</span>
                    </button>
                ))}
            </div>
            {error && (
                <p className="text-xs text-error animate-pulse">{error}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
                {selected === "huggingface" && "DeepSeek-R1 (Free)"}
                {selected === "google" && "Gemini 2.0 Flash"}
                {selected === "openai" && "GPT-4o"}
                {selected === "anthropic" && "Claude (Coming soon)"}
            </p>
        </div>
    );
}
