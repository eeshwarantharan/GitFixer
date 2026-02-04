# 🔧 GitFixer

> **AI-powered GitHub issue fixer that creates PRs while you sleep** 😴

GitFixer watches your GitHub repositories and automatically fixes bugs using open-source AI models. When a new issue is opened, it analyzes your codebase, generates a fix, and creates a pull request — all without human intervention.

---

## ✨ Features

- **🤖 Automatic Bug Fixing** — New issue opened? AI reads your code, understands the bug, and creates a PR
- **🔓 100% Open Source AI** — Choose from DeepSeek R1, Qwen2.5, Mixtral, or bring your own API key
- **🆓 Free Tier Friendly** — HuggingFace integration means you can run this for $0
- **⚡ Smart Fallback** — If one AI hits rate limits, automatically switches to another
- **🔐 Secure** — API keys encrypted with AES-256-GCM, GitHub OAuth for auth
- **🌙 Works 24/7** — Fixes issues even when you're asleep

---

## 🎯 Perfect For

- **Unmaintained repos** with piling issues
- **Research paper code** that nobody has time to maintain
- **Side projects** you built 3 years ago
- **Open source maintainers** drowning in bug reports

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Neon Serverless)
- **Auth**: NextAuth.js + GitHub OAuth
- **Background Jobs**: Inngest
- **AI**: HuggingFace Inference API / OpenAI / Google Gemini / Anthropic
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- GitHub OAuth App
- At least one AI API key (HuggingFace is free!)

### 1. Clone & Install

```bash
git clone https://github.com/eeshwarantharan/GitFixer.git
cd GitFixer
npm install
```

### 2. Environment Setup

Copy the example env file:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Encryption (for API keys)
ENCRYPTION_KEY="..."  # Generate: openssl rand -hex 32

# Inngest (https://inngest.com)
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Inngest Dev Server
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📦 Deployment (Vercel)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

**Important**: After deployment, update:
- `NEXTAUTH_URL` to your Vercel URL
- GitHub OAuth callback URL to `https://your-app.vercel.app/api/auth/callback/github`
- Inngest integration (connect via Vercel integration)

---

## 🔑 Getting API Keys

### HuggingFace (FREE) — Recommended
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create new token with "Read" access
3. Add to GitFixer Settings

### Google Gemini
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create API key
3. Add to GitFixer Settings

### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Add to GitFixer Settings

---

## 🏗️ How It Works

```
1. You enable "Watch" on a repository
   ↓
2. GitFixer creates a webhook on that repo
   ↓
3. New issue opened → GitHub notifies GitFixer
   ↓
4. Inngest triggers the fix-issue function
   ↓
5. AI analyzes code + generates fix
   ↓
6. GitFixer creates a PR with the solution
   ↓
7. You review & merge 🎉
```

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit PRs

---

## 📄 License

MIT © [Tharan](https://linkedin.com/in/tharaneeshwaran)

---

## 🙏 Credits

Built with ❤️ at [SeNSE Lab, IIT Madras](https://sense.cse.iitm.ac.in)

**Open Source AI Models Used:**
- [DeepSeek R1](https://huggingface.co/deepseek-ai/DeepSeek-R1)
- [Qwen2.5](https://huggingface.co/Qwen)
- [Mixtral](https://huggingface.co/mistralai)
