import { NextResponse } from "next/server";

// This is a temporary debug endpoint - remove after fixing OAuth
export async function GET() {
    return NextResponse.json({
        hasClientId: !!process.env.GITHUB_CLIENT_ID,
        clientIdLength: process.env.GITHUB_CLIENT_ID?.length || 0,
        clientIdStart: process.env.GITHUB_CLIENT_ID?.substring(0, 5) || "none",
        hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
        secretLength: process.env.GITHUB_CLIENT_SECRET?.length || 0,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || "not set",
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
    });
}
