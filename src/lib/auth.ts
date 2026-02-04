import { NextAuthOptions, getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
// Temporarily disabled for debugging
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import type { Adapter } from "next-auth/adapters";
// import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    // Temporarily disabled adapter for debugging
    // adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]) as Adapter,
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt", // Changed from database to JWT for testing
    },
    debug: true,
};

export const auth = () => getServerSession(authOptions);

export { getServerSession };
