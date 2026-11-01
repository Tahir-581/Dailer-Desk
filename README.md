# Dailer Desk: Voice AI Agent Dashboard

A multi-tenant Next.js dashboard for building and running voice AI phone agents on [LiveKit](https://livekit.io). Organizations create voice assistants, attach knowledge bases (RAG), design conversation flows, connect phone numbers over SIP, and review calls with transcripts and LLM-based post-call analysis.

The real-time voice worker that runs the calls is in [Dailer-Desk-Python](https://github.com/Tahir-581/Dailer-Desk-Python).

## Features

- **Multi-tenant orgs and auth.** Email/password auth with better-auth, organizations and memberships, and per-org LiveKit credentials (optionally auto-provisioned through the LiveKit Cloud API).
- **Voice assistants.** Configure the prompt, STT/LLM/TTS models and voices (Cartesia and ElevenLabs voice catalogs), call-transfer and SMS tools, and custom HTTP function tools.
- **Knowledge bases (RAG).** Ingest web pages (cheerio scraper) and PDFs (pdf-parse), chunk them, embed with Gemini, and store the vectors in Postgres/pgvector.
- **Conversation-flow builder.** Visual node graph (React Flow) with conversation, logic split, variable extraction, press-digit, SMS, call-transfer, agent-transfer and end-call nodes.
- **Telephony.** Phone numbers, SIP-connected numbers, dispatch rules, inbound and batch outbound calls.
- **Call history and analytics.** Transcript segments, LiveKit Egress recordings to S3-compatible storage (Supabase Storage), and Gemini post-call analysis with org-defined custom analysis fields. Charts use Recharts.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui (Radix) · Drizzle ORM · PostgreSQL + pgvector · better-auth · LiveKit (client, server SDK, components) · Google Gemini · React Flow

## Getting started

Prerequisites: Node.js 18+, pnpm, Postgres with the `vector` extension, and a LiveKit Cloud project.

```bash
cp .env.example .env.local   # fill in DATABASE_URL, LiveKit keys, GEMINI_API_KEY, ...
pnpm install
pnpm db:push                 # sync the Drizzle schema to Postgres
pnpm dev                     # http://localhost:3000
```

Sign up, create an organization, then add an assistant. Run the [Python worker](https://github.com/Tahir-581/Dailer-Desk-Python) with the same LiveKit project, and set `NEXT_PUBLIC_LIVEKIT_AGENT_NAME` to match its `LIVEKIT_AGENT_NAME`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm db:generate` / `pnpm db:migrate` | Generate and apply Drizzle migrations |
| `pnpm db:push` | Push the schema directly |
| `pnpm db:studio` | Drizzle Studio |

## Project structure

```
app/            Next.js routes: (dashboard) pages, api/ route handlers, login/signup
components/     UI: assistants, workflows, analytics, kb, telephony, shadcn/ui primitives
lib/            db schema (Drizzle), auth, LiveKit helpers + egress, kb (scraper, embeddings),
                transcription and AI analysis services
drizzle/        SQL migrations
hooks/          React hooks
```

## License

MIT
