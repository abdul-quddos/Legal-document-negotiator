# Legal Negotiator

AI-powered legal document negotiation tool.

## Features

- 🔐 **Auth** — Login with email or username
- 📄 **Upload** — TXT files or paste text directly
- 🤖 **AI Analysis** — Identifies risky clauses with plain English explanations
- 🎯 **Risk Levels** — 🔴 High / 🟡 Medium / 🟢 Low
- ✏️ **Apply Changes** — One-click AI clause rewriting
- 📊 **Progress Tracker** — Track negotiation progress
- 📥 **Export** — Download as PDF or TXT

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Upstash Redis |
| Auth | NextAuth.js |
| AI | Groq API (Llama 3.3 70B) |
| Deployment | Vercel |

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/legal-negotiator.git
cd legal-negotiator

# Install dependencies
npm install

# Create .env.local file with:
# - GROQ_API_KEY
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# Run development server
npm run dev