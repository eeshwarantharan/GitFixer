"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type Provider = "huggingface" | "google" | "openai" | "anthropic";

export async function getPreferredProvider(): Promise<Provider> {
    const session = await auth();
    if (!session?.user?.id) return "huggingface";

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferredProvider: true },
    });

    return (user?.preferredProvider as Provider) || "huggingface";
}

export async function setPreferredProvider(
    provider: Provider
): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "Not authenticated" };
        }

        // Check if user has the API key for this provider
        const apiKey = await prisma.aPIKey.findFirst({
            where: { userId: session.user.id, provider },
        });

        if (!apiKey) {
            return {
                success: false,
                message: `No ${provider} API key found. Add one in Settings first.`,
            };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { preferredProvider: provider },
        });

        revalidatePath("/dashboard");
        return { success: true, message: `Switched to ${provider}` };
    } catch (error) {
        console.error("Failed to set provider:", error);
        return { success: false, message: "Failed to update preference" };
    }
}
