import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    CheckCircledIcon,
    CrossCircledIcon,
    ReloadIcon,
    ClockIcon,
} from "@radix-ui/react-icons";

const statusConfig = {
    pending: { label: "PENDING", class: "status-pending", Icon: ClockIcon },
    processing: { label: "PROCESSING", class: "status-processing", Icon: ReloadIcon },
    success: { label: "OK", class: "status-ok", Icon: CheckCircledIcon },
    failed: { label: "ERR", class: "status-err", Icon: CrossCircledIcon },
} as const;

type IssueLogWithRepo = {
    id: string;
    status: string;
    createdAt: Date;
    issueNumber: number;
    issueTitle: string;
    prNumber: number | null;
    prUrl: string | null;
    repo: {
        fullName: string;
    };
};

export default async function DashboardPage() {
    const session = await auth();

    // Fetch recent activity
    const recentLogs: IssueLogWithRepo[] = await prisma.issueLog.findMany({
        where: { userId: session!.user!.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
            repo: {
                select: { fullName: true },
            },
        },
    });

    // Fetch stats
    const [totalRepos, totalFixed, totalFailed] = await Promise.all([
        prisma.repo.count({ where: { userId: session!.user!.id, isWatched: true } }),
        prisma.issueLog.count({ where: { userId: session!.user!.id, status: "success" } }),
        prisma.issueLog.count({ where: { userId: session!.user!.id, status: "failed" } }),
    ]);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">[ DASHBOARD ]</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Welcome back, {session?.user?.name?.split(" ")[0]}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card-retro">
                    <div className="text-3xl font-bold">{totalRepos}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                        Repos Watched
                    </div>
                </div>
                <div className="card-retro">
                    <div className="text-3xl font-bold text-success">{totalFixed}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                        Issues Fixed
                    </div>
                </div>
                <div className="card-retro">
                    <div className="text-3xl font-bold text-error">{totalFailed}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                        Failed Attempts
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card-retro">
                <div className="card-retro-header">
                    <h2 className="font-bold">[ RECENT ACTIVITY ]</h2>
                </div>

                {recentLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No activity yet.</p>
                        <p className="text-sm mt-2">
                            Watch some repos and create issues to get started.
                        </p>
                    </div>
                ) : (
                    <div className="terminal-block">
                        {recentLogs.map((log) => {
                            const config = statusConfig[log.status as keyof typeof statusConfig];
                            const date = new Date(log.createdAt).toLocaleString("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                            });

                            return (
                                <div key={log.id} className="flex items-start gap-4 py-2">
                                    <span className="output shrink-0">[{date}]</span>
                                    <span className={`status-badge ${config.class} shrink-0`}>
                                        [ {config.label} ]
                                    </span>
                                    <span className="command truncate">
                                        {log.repo.fullName} #{log.issueNumber}: {log.issueTitle}
                                    </span>
                                    {log.prUrl && (
                                        <a
                                            href={log.prUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:underline shrink-0"
                                        >
                                            PR #{log.prNumber}
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
