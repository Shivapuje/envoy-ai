# Architecture & Design Document

**Author:** Vinayak Shivapuje

## Overview

Envoy AI is a multi-agent orchestration platform that uses specialized AI agents to automate personal workflows. This document describes the technical architecture, design decisions, and patterns used throughout the system.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                         (Next.js + React)                                │
├─────────────────────────────────────────────────────────────────────────┤
│   Dashboard          │   Inbox            │   Finance       │  Agents   │
│   (page.tsx)         │   (email/page.tsx) │   (finance/)    │  (agents/)│
├─────────────────────────────────────────────────────────────────────────┤
│                     Passkey Auth (WebAuthn)                              │
│                        (AuthContext.tsx)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                              REST API                                    │
│                          (HTTP/JSON)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                     │
│                         (FastAPI + Python)                               │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│   API Layer      │   Service Layer  │   AI Layer       │   Data Layer   │
│   /api/auth.py   │   ai_engine.py   │   RAG context    │   PostgreSQL   │
│   /api/email.py  │   rag_service.py │   (pgvector)     │   (pgvector)   │
│   /api/finance   │   auth_service   │   Embeddings     │   models.py    │
│   /api/agent_logs│   email_collector│   (sentence-tf)  │                │
└──────────────────┴──────────────────┴──────────────────┴────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           LiteLLM                                        │
│                    (Model Orchestration)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│   Groq           │   OpenAI         │   Anthropic      │   Ollama       │
│   (Llama 3.3)    │   (GPT-4o)       │   (Claude 3)     │   (Local)      │
└──────────────────┴──────────────────┴──────────────────┴────────────────┘
```

---

## Core Components

### 1. AI Engine (`services/ai_engine.py`)

The central orchestrator that routes tasks to appropriate agents and models.

**Responsibilities:**
- Model selection based on task type
- Agent instantiation and execution
- RAG context injection (retrieve similar past emails before LLM call)
- RAG storage (store results after successful analysis)
- Error handling and fallbacks

**Key Pattern: Per-Agent Model Configuration**

```python
MODEL_CONFIG = {
    "email":       "groq/llama-3.3-70b-versatile",
    "finance":     "groq/llama-3.3-70b-versatile",
    "credit_card": "openai/gpt-4o",
}
```

### 2. RAG Service (`services/rag_service.py`)

pgvector-powered context retrieval for AI agents.

**How it works:**
1. When an email is processed, the text is embedded via `sentence-transformers` (all-MiniLM-L6-v2, 384-dim)
2. The embedding + analysis metadata are stored in `email_embeddings` table
3. When processing a new email, the top-3 similar past emails are retrieved via cosine distance
4. Similar emails + user corrections are injected into the LLM system prompt

**Tables:**
- `email_embeddings` — Vector(384) + category, urgency_score, summary
- `correction_embeddings` — Vector(384) + field, old_value, new_value

### 3. Authentication (`services/auth_service.py`)

Passkey-based authentication using WebAuthn.

- **Registration:** Browser creates a credential, server verifies and stores
- **Login:** Challenge-response flow using stored credential
- **Sessions:** JWT tokens with configurable expiration
- **Dev mode:** `DISABLE_AUTH=true` bypasses all auth checks

### 4. Multi-Tenancy

All data is user-scoped via `user_id` foreign key on:
- `Email`, `Transaction`, `AgentLog`, `ProcessedEmail`, `AgentPreference`, `UserCorrection`
- `EmailEmbedding`, `CorrectionEmbedding`

The `get_active_user` dependency returns `None` when `DISABLE_AUTH=true`, making all queries return unscoped data.

### 5. Database (`database.py`)

Dual database support:

| Environment | Database | Config |
|-------------|----------|--------|
| Local dev | SQLite | Default (no env var needed) |
| Docker | PostgreSQL + pgvector | `DATABASE_URL` set in docker-compose |
| Production | Cloud PostgreSQL | `DATABASE_URL` from hosting env |

`init_db()` enables the pgvector extension when using PostgreSQL.

### 6. Email Collector (`services/email_collector.py`)

IMAP client that syncs emails to the database.

**Optimizations:**
- Pre-loads existing message IDs in one query (O(1) duplicate check)
- Limits batch size (100 emails per sync)
- Email associated with `user_id` for multi-tenancy

---

## Design Patterns

### Model-Agnostic via LiteLLM

All LLM calls go through LiteLLM, enabling unified API across providers, easy model swapping per-agent, and fallback chains.

### Agent Handoff Pattern

When Email Agent detects a specialized category:

```python
if category == "finance":
    finance_result = _process_finance_email(db, ai_engine, email, text, user_id=user_id)
    analysis["finance_data"] = finance_result
```

### RAG Context Injection

```python
# Before LLM call
rag_context = self._get_rag_context(text, user_id)
if rag_context:
    system_prompt += f"\n\nContext from similar past emails:\n{rag_context}"

# After successful analysis
self._store_rag_context(email_id, text, parsed, user_id)
```

### Progressive Enhancement

UI works without AI:
1. **Sync**: Emails fetched and stored (no AI needed)
2. **Manual trigger**: User clicks "Run Agent" to process
3. **Auto-process**: Background job processes new emails

---

## API Design

### Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register/start` | Begin passkey registration |
| POST | `/api/auth/register/finish` | Complete registration |
| POST | `/api/auth/login/start` | Begin passkey login |
| POST | `/api/auth/login/finish` | Complete login |
| GET | `/api/auth/me` | Get current user |

### Email Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/email/sync` | Fetch emails from IMAP |
| POST | `/api/email/analyze-pending` | Run Email Agent on pending |
| POST | `/api/email/analyze/{id}` | Process single email |
| GET | `/api/email/list` | List emails (pending first) |
| POST | `/api/email/{id}/correct` | Submit correction for RAG learning |

### Finance Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/finance/transactions` | List transactions |
| POST | `/api/finance/parse` | Manual text parsing |

### Agent Logs Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/agents/logs` | Get agent execution logs |
| GET | `/api/agents/flows` | Get grouped flow runs |
| GET | `/api/agents/flows/{run_id}` | Get specific flow details |

---

## Docker Architecture

```yaml
services:
  postgres:     # pgvector/pgvector:pg16 — PostgreSQL with vector extension
  backend:      # FastAPI + Uvicorn with hot-reload
  frontend:     # Next.js dev server with polling
```

**Startup order:** `postgres` (healthcheck) → `backend` (healthcheck) → `frontend`

**Volumes:** `postgres-data` for persistent database storage.

---

## Security

1. **Passkey Auth**: Phishing-resistant WebAuthn credentials
2. **JWT Sessions**: Configurable expiration, signed with secret key
3. **API Keys**: Stored in `.env`, never committed
4. **Multi-Tenancy**: Data isolated per user
5. **Self-Hostable**: All data stays on your infrastructure

---

## Performance

1. **Email Sync**: Pre-load IDs, batch commits
2. **RAG**: pgvector cosine distance queries with indexed vectors
3. **Embeddings**: `all-MiniLM-L6-v2` for fast local embedding (384-dim)
4. **LLM Calls**: Groq for speed (< 500ms typical)
5. **Frontend**: React Query for caching, optimistic updates

---

*Last updated: February 16, 2026*
