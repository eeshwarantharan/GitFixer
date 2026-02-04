import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { preferredProvider } = body;

        if (!preferredProvider || !["huggingface", "google", "openai", "anthropic"].includes(preferredProvider)) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        // Update user's preferred provider in the database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { preferredProvider },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferredProvider: true },
        });

        return NextResponse.json({
            preferredProvider: user?.preferredProvider || "huggingface"
        });
    } catch (error) {
        console.error("Failed to get preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
