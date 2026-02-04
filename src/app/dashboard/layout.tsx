import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    GearIcon,
    GitHubLogoIcon,
    ActivityLogIcon,
    ExitIcon,
} from "@radix-ui/react-icons";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 border-r-2 border-border bg-card flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b-2 border-border">
                    <Link href="/dashboard" className="text-lg font-bold tracking-tight">
                        [ GITFIXER ]
                    </Link>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        {session.user.image && (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                width={40}
                                height={40}
                                className="border-2 border-border flex-shrink-0"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate max-w-[140px]">
                                {session.user.name?.split(" ")[0] || "User"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {session.user.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <ActivityLogIcon className="w-4 h-4" />
                                Activity
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/dashboard/repos"
                                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <GitHubLogoIcon className="w-4 h-4" />
                                Repositories
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/dashboard/settings"
                                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <GearIcon className="w-4 h-4" />
                                Settings
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <ExitIcon className="w-4 h-4" />
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}
