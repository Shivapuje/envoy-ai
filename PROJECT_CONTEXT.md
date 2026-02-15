# Envoy AI - Project Context

**Author:** Vinayak Shivapuje

## What is Envoy AI?

Envoy AI is your **Personal Chief of Staff** — an AI-powered assistant that manages your digital life by orchestrating specialized agents. Instead of one AI trying to do everything, Envoy uses expert agents that collaborate:

- **Email Agent** triages your inbox
- **Finance Agent** extracts transactions from bank emails
- **Credit Card Agent** parses credit card statements
- **Calendar Agent** parses meeting invites *(coming soon)*
- **Investment Advisor** analyzes your portfolio *(coming soon)*

## Current State (v0.2)

### Working Features

✅ **Email Sync** — IMAP connection, duplicate detection, user-scoped storage

✅ **Email Agent** — Categorize, summarize, urgency score, action items

✅ **Finance Agent** — Extract amount, vendor, date, transaction type

✅ **Credit Card Agent** — Parse full credit card statements including EMI transactions

✅ **RAG Context** — Agents retrieve similar past emails + user corrections via pgvector to improve accuracy over time

✅ **Passkey Authentication** — Passwordless WebAuthn login with JWT sessions

✅ **Multi-Tenancy** — All data (emails, transactions, logs, embeddings) scoped per user

✅ **Docker Environment** — PostgreSQL (pgvector) + Backend + Frontend with hot-reload and auto-recovery

✅ **Dashboard** — Live pending email count, quick actions, agent status

✅ **Inbox UI** — Category filters, email detail modal, one-click AI processing, user corrections

✅ **Finance UI** — Transaction table, stats summary, category filters

✅ **Agents Page** — Execution logs, flow visualization, model configuration

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | FastAPI, Python 3.11+, SQLAlchemy |
| Database | PostgreSQL 16 + pgvector (Docker), SQLite (local dev) |
| AI/LLM | LiteLLM (Groq default), sentence-transformers |
| Auth | WebAuthn (passkeys) + JWT |
| Email | IMAP via imap-tools |
| Deployment | Docker Compose |

## Design Philosophy

### 1. Model Agnostic
Each agent can use a different LLM provider. Groq for speed, OpenAI for accuracy, Anthropic for deep analysis.

### 2. Agent Specialization
One agent, one job. The Email Agent doesn't extract transactions — it hands off to the Finance Agent.

### 3. RAG-Enhanced
Agents learn from history. Past emails and user corrections are embedded and retrieved as context for new analyses.

### 4. User in Control
AI suggests, user confirms. Corrections feed back into the RAG system.

### 5. Privacy First
Self-hostable, no telemetry, all data stays on your infrastructure.

## Development Priorities

### Completed ✅
1. ~~IMAP email sync~~
2. ~~Email + Finance agents~~
3. ~~Agent execution logging~~
4. ~~Email detail modal~~
5. ~~Docker environment~~
6. ~~Passkey authentication~~
7. ~~Multi-tenancy~~
8. ~~RAG system (pgvector)~~
9. ~~PostgreSQL migration~~

### Next Up
1. Calendar Agent MVP
2. Cloud deployment (Fly.io / Railway)
3. CI/CD pipeline
4. Agent configuration UI
5. Mobile-responsive improvements

### Future
1. Voice interface
2. Browser extension
3. Proactive suggestions
4. Cross-agent insights

---

*This document reflects the state as of February 16, 2026*