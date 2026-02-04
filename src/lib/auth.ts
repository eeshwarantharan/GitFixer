import { NextAuthOptions, getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]) as Adapter,
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
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
        async signIn({ user, account }) {
            if (account?.provider === "github" && user.id) {
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            githubId: account.providerAccountId,
                        },
                    });
                } catch (error) {
                    console.error("Failed to update user with GitHub ID:", error);
                }
            }
            return true;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "database",
    },
    debug: process.env.NODE_ENV === "development",
};

export const auth = () => getServerSession(authOptions);

export { getServerSession };
