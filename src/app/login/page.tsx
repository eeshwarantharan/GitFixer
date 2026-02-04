"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export default function LoginPage() {
    const handleSignIn = () => {
        signIn("github", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
            <div className="card-retro w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        [ GITFIXER ]
                    </Link>
                    <p className="text-muted-foreground text-sm mt-2">
                        Sign in to start fixing bugs automatically
                    </p>
                </div>

                {/* Sign In Button */}
                <button
                    onClick={handleSignIn}
                    className="btn-retro w-full justify-center flex items-center gap-2"
                >
                    <GitHubLogoIcon className="w-5 h-5" />
                    SIGN IN WITH GITHUB
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-4 text-xs text-muted-foreground">INFO</span>
                    <div className="flex-1 border-t border-border" />
                </div>

                {/* Info */}
                <div className="text-center text-sm text-muted-foreground">
                    <p>We need repo access to:</p>
                    <ul className="mt-2 space-y-1">
                        <li>• Read issues from your repositories</li>
                        <li>• Create branches and commits</li>
                        <li>• Open pull requests</li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                    By signing in, you agree to our Terms of Service
                </div>
            </div>

            {/* Back Link */}
            <Link href="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to home
            </Link>
        </div>
    );
}
