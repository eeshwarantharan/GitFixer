"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt, validateDecryptedKey } from "@/lib/encryption";

export async function saveApiKey(
    provider: "openai" | "anthropic" | "google",
    apiKey: string
): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "Not authenticated" };
        }

        // Validate key format
        if (!validateDecryptedKey(apiKey, provider)) {
            const providerName = provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : "Google Gemini";
            return {
                success: false,
                message: `Invalid ${providerName} API key format`,
            };
        }

        // Encrypt the key
        const { encryptedKey, iv, authTag } = encrypt(apiKey);

        // Upsert the API key
        await prisma.aPIKey.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider,
                },
            },
            update: {
                encryptedKey,
                iv,
                authTag,
                isValid: true, // Reset validity on update
            },
            create: {
                userId: session.user.id,
                provider,
                encryptedKey,
                iv,
                authTag,
            },
        });

        const providerName = provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : "Google Gemini";
        return {
            success: true,
            message: `${providerName} API key saved successfully`,
        };
    } catch (error) {
        console.error("Failed to save API key:", error);

        // Check for encryption key missing
        if (error instanceof Error && error.message.includes("ENCRYPTION_KEY")) {
            return {
                success: false,
                message: "Server configuration error. Contact administrator.",
            };
        }

        return { success: false, message: "Failed to save API key" };
    }
}
