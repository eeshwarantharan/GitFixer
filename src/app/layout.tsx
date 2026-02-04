import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ParticleCanvas } from "@/components/particle-canvas";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitFixer | Self-Healing Repos",
  description:
    "Automatically fix bugs/issues and open pull requests using AI. Connect your GitHub repos and let GitFixer do the rest.",
  keywords: ["github", "bug fix", "ai", "automation", "pull request", "openai", "gemini", "anthropic"],
  authors: [{ name: "Tharan", url: "https://sense.cse.iitm.ac.in" }],
  openGraph: {
    title: "GitFixer | Self-Healing Repos",
    description:
      "Automatically fix bugs and open pull requests using AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.variable} font-mono antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ParticleCanvas />
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

