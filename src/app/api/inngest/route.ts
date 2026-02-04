import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions/fix-issue";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions,
    serveHost: "https://git-fixer.vercel.app",
    streaming: "allow",
});
