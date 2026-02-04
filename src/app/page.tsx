import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { GitHubLogoIcon, RocketIcon, LightningBoltIcon, LockClosedIcon } from "@radix-ui/react-icons";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="GitFixer" width={32} height={32} className="rounded" />
            <span className="text-xl font-bold tracking-tight">
              [ GITFIXER ]
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="btn-retro">
              SIGN IN
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-accent text-accent text-sm font-medium">
            <span className="w-2 h-2 bg-accent animate-pulse" />
            SELF-HEALING BUG FIXER
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Fix bugs automatically,
            <br />
            <span className="text-accent">Even when you&apos;re asleep...</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Connect your GitHub repos, provide your API key, and watch as
            GitFixer automatically fixes issues and opens pull requests.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-retro-accent btn-retro">
              <GitHubLogoIcon className="w-4 h-4" />
              GET STARTED WITH GITHUB
            </Link>
            <Link href="#how-it-works" className="btn-retro">
              HOW IT WORKS
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-4 h-4" />
              <span>Your API key, encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <RocketIcon className="w-4 h-4" />
              <span>"Ship fixes, not excuses"</span>
            </div>
            <div className="flex items-center gap-2">
              <LightningBoltIcon className="w-4 h-4" />
              <span>Open source</span>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t-2 border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            [ HOW IT WORKS ]
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card-retro">
              <div className="text-accent font-bold text-sm mb-2">01</div>
              <h3 className="text-lg font-bold mb-2">Connect GitHub</h3>
              <p className="text-muted-foreground text-sm">
                Sign in with GitHub and select which repositories to watch.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card-retro">
              <div className="text-accent font-bold text-sm mb-2">02</div>
              <h3 className="text-lg font-bold mb-2">Add API Key</h3>
              <p className="text-muted-foreground text-sm">
                Provide your OpenAI, Google Gemini, or Anthropic API key. Stored encrypted.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card-retro">
              <div className="text-accent font-bold text-sm mb-2">03</div>
              <h3 className="text-lg font-bold mb-2">Auto-Fix Issues</h3>
              <p className="text-muted-foreground text-sm">
                When issues are created, GitFixer analyzes, fixes, and opens PRs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="border-t-2 border-border py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="terminal-block">
            <div className="mb-2">
              <span className="prompt">$</span>
              <span className="command"> gitfixer watching yourname/myapp</span>
            </div>
            <div className="output">
              {"[2026-02-04 10:23:01]"} Issue #42 detected: &quot;Login button broken&quot;
            </div>
            <div className="output">
              {"[2026-02-04 10:23:02]"} Analyzing codebase...
            </div>
            <div className="output">
              {"[2026-02-04 10:23:15]"} Root cause: onClick handler missing
            </div>
            <div className="output">
              {"[2026-02-04 10:23:20]"} Fix generated: src/components/LoginButton.tsx
            </div>
            <div className="output">
              {"[2026-02-04 10:23:25]"} Verification: <span className="text-success">[ PASSED ]</span>
            </div>
            <div className="output">
              {"[2026-02-04 10:23:30]"} PR opened: #43 - fix: add onClick handler to LoginButton
            </div>
            <div className="mt-2">
              <span className="prompt">$</span>
              <span className="command animate-pulse"> _</span>
            </div>
          </div>
        </div>
      </section>
      {/* Future Work Section */}
      <section className="border-t-2 border-border py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">[ COMING SOON ]</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="card-retro text-left">
              <div className="text-accent font-bold text-xs mb-2">[ PLANNED ]</div>
              <h3 className="font-bold mb-1">MCP Integration</h3>
              <p className="text-muted-foreground text-sm">
                Model Context Protocol support for advanced AI tool orchestration.
              </p>
            </div>
            <div className="card-retro text-left">
              <div className="text-accent font-bold text-xs mb-2">[ PLANNED ]</div>
              <h3 className="font-bold mb-1">Multi-Repo Fixes</h3>
              <p className="text-muted-foreground text-sm">
                Fix issues that span across multiple repositories at once.
              </p>
            </div>
            <div className="card-retro text-left">
              <div className="text-accent font-bold text-xs mb-2">[ PLANNED ]</div>
              <h3 className="font-bold mb-1">Custom Fix Rules</h3>
              <p className="text-muted-foreground text-sm">
                Define your own fix patterns and code style preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="border-t-2 border-border py-16 px-6 bg-muted">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">[ JOIN THE MOVEMENT ]</h2>
          <p className="text-lg text-muted-foreground mb-6">
            &quot;Great code is written by many hands.&quot;
          </p>
          <p className="text-muted-foreground mb-8">
            GitFixer is open source and we welcome contributors of all skill levels.
            Whether it&apos;s fixing bugs, adding features, or improving docs — your PR matters.
          </p>
          <a
            href="https://github.com/eeshwarantharan/GitFixer"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-retro-accent btn-retro"
          >
            <GitHubLogoIcon className="w-4 h-4" />
            CONTRIBUTE ON GITHUB
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            Made by <span className="font-semibold text-foreground">Tharan</span> (<a href="https://sense.cse.iitm.ac.in" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">SeNSE Lab, IIT Madras</a>)
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/tharaneeshwaran/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/eeshwarantharan/GitFixer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              aria-label="GitHub"
            >
              <GitHubLogoIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
