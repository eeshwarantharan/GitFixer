import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { APIKeyForm } from "./api-key-form";

type APIKeyInfo = {
    id: string;
    provider: string;
    isValid: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export default async function SettingsPage() {
    const session = await auth();

    // Fetch existing API keys (just metadata, not the actual keys)
    const apiKeys: APIKeyInfo[] = await prisma.aPIKey.findMany({
        where: { userId: session!.user!.id },
        select: {
            id: true,
            provider: true,
            isValid: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const hasOpenAI = apiKeys.find((k) => k.provider === "openai");
    const hasAnthropic = apiKeys.find((k) => k.provider === "anthropic");
    const hasGoogle = apiKeys.find((k) => k.provider === "google");

    return (
        <div className="p-8 max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">[ SETTINGS ]</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Configure your API keys and preferences
                </p>
            </div>

            {/* API Keys Section */}
            <section className="card-retro mb-8">
                <div className="card-retro-header">
                    <h2 className="font-bold">[ API KEYS ]</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Your API keys are encrypted with AES-256-GCM before storage.
                    We never store keys in plain text.
                </p>

                {/* OpenAI Key */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        {hasOpenAI && (
                            <span className={`status-badge ${hasOpenAI.isValid ? "status-ok" : "status-err"}`}>
                                [ {hasOpenAI.isValid ? "VALID" : "INVALID"} ]
                            </span>
                        )}
                    </div>
                    <APIKeyForm
                        provider="openai"
                        hasExisting={!!hasOpenAI}
                        placeholder="sk-..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Get your key from{" "}
                        <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                        >
                            platform.openai.com
                        </a>
                    </p>
                </div>

                {/* Google Gemini Key */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Google Gemini API Key</label>
                        {hasGoogle && (
                            <span className={`status-badge ${hasGoogle.isValid ? "status-ok" : "status-err"}`}>
                                [ {hasGoogle.isValid ? "VALID" : "INVALID"} ]
                            </span>
                        )}
                    </div>
                    <APIKeyForm
                        provider="google"
                        hasExisting={!!hasGoogle}
                        placeholder="AIza..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Get your key from{" "}
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                        >
                            aistudio.google.com
                        </a>
                    </p>
                </div>

                {/* Anthropic Key */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Anthropic API Key</label>
                        {hasAnthropic && (
                            <span className={`status-badge ${hasAnthropic.isValid ? "status-ok" : "status-err"}`}>
                                [ {hasAnthropic.isValid ? "VALID" : "INVALID"} ]
                            </span>
                        )}
                    </div>
                    <APIKeyForm
                        provider="anthropic"
                        hasExisting={!!hasAnthropic}
                        placeholder="sk-ant-..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Get your key from{" "}
                        <a
                            href="https://console.anthropic.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                        >
                            console.anthropic.com
                        </a>
                    </p>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="card-retro border-error">
                <div className="card-retro-header">
                    <h2 className="font-bold text-error">[ DANGER ZONE ]</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    These actions are irreversible. Proceed with caution.
                </p>
                <button className="btn-retro text-error border-error hover:bg-error hover:text-error-foreground">
                    DELETE ACCOUNT
                </button>
            </section>
        </div>
    );
}
