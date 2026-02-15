# Envoy AI

**Your Personal Chief of Staff** — An AI-powered workspace that orchestrates multiple specialized agents to manage your digital life.

**Author:** Vinayak Shivapuje

## 🎯 Vision

Envoy AI is a **model-agnostic multi-agent orchestration platform** where specialized AI agents work together in harmony. Each agent is an expert in its domain — triaging emails, extracting financial data, managing calendars — and they communicate seamlessly to automate complex workflows.

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENVOY AI                                 │
│                   Agent Orchestration Layer                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ Email Agent │───▶│Finance Agent│───▶│Calendar Agent│       │
│   │ (Groq/Llama)│    │ (Groq/Llama)│    │  (OpenAI)   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────────────────────────────────────────┐         │
│   │        RAG Context (pgvector in PostgreSQL)      │         │
│   └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🤖 Multi-Agent Orchestration

| Agent | Model | Purpose | Status |
|-------|-------|---------|--------|
| **Email Triage** | Groq (Llama 3.3 70B) | Categorize, summarize, extract action items | ✅ Active |
| **Finance** | Groq (Llama 3.3 70B) | Extract transactions from bank emails | ✅ Active |
| **Credit Card** | OpenAI (GPT-4o) | Parse credit card statements | ✅ Active |
| **Calendar** | *Configurable* | Parse events, schedule meetings | 🚧 Planned |
| **Investment Advisor** | *Configurable* | Portfolio analysis, market insights | 🚧 Planned |

### 🔐 Passkey Authentication

Passwordless WebAuthn-based auth with JWT session management. Disable with `DISABLE_AUTH=true` for local dev.

### 👥 Multi-Tenancy

All data is user-scoped — emails, transactions, agent logs, and preferences are isolated per user. Backward-compatible with `DISABLE_AUTH=true`.

### 🧠 RAG Context (pgvector)

AI agents have memory. Processed emails are stored as vector embeddings in PostgreSQL (via pgvector). When analyzing a new email, the system retrieves similar past emails and user corrections to improve accuracy over time.

```
New email → embed text → query pgvector for similar past emails
         → inject matches into LLM system prompt
         → LLM uses context for better categorization
         → result stored back for future context
```

### 🧠 Model-Agnostic Architecture

Powered by **LiteLLM**, Envoy supports any LLM provider with a unified API:

```python
MODEL_CONFIG = {
    "email":       "groq/llama-3.3-70b-versatile",  # Fast, free
    "finance":     "groq/llama-3.3-70b-versatile",   # Accurate extraction
    "credit_card": "openai/gpt-4o",                  # High accuracy
}
```

**Supported Providers:** Groq, OpenAI, Anthropic, Google, Ollama, 100+ more via LiteLLM.

### 🎨 Modern UI

- **Dark glassmorphism design** with consistent theming
- **Dashboard** with pending tasks, quick actions, agent status
- **Inbox** with category filters, pending/processed views, email detail modal
- **Finance tracker** with transaction table, stats
- **Agents page** with flow visualization, execution logs, model configuration
- **Responsive** sidebar navigation

## 🚀 Getting Started

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai

# Configure backend env
cp backend/.env.example backend/.env
# Edit backend/.env — add your API keys

# Start everything
docker compose up --build
```

**Services:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### Option 2: Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

> **Note:** Local dev uses SQLite by default. Docker uses PostgreSQL with pgvector.

### Environment Variables

```env
# Required: At least one LLM provider
GROQ_API_KEY=gsk_...        # Recommended (free tier)
OPENAI_API_KEY=sk-...       # Optional
ANTHROPIC_API_KEY=sk-ant-...# Optional

# Email (for IMAP sync)
IMAP_SERVER=imap.gmail.com
EMAIL_USER=your@email.com
EMAIL_PASS=your-app-password

# Auth (set to true to bypass passkey auth in dev)
DISABLE_AUTH=true

# Database (auto-set by Docker, override for cloud PostgreSQL)
# DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## 📁 Project Structure

```
envoy-ai/
├── docker-compose.yml         # PostgreSQL (pgvector) + Backend + Frontend
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py        # Passkey auth + JWT
│   │   │   ├── email.py       # Email sync, analyze, correct
│   │   │   ├── finance.py     # Transactions
│   │   │   └── agent_logs.py  # Agent execution logs
│   │   ├── services/
│   │   │   ├── ai_engine.py   # LiteLLM orchestration + RAG
│   │   │   ├── rag_service.py # pgvector RAG context
│   │   │   ├── auth_service.py# WebAuthn passkeys
│   │   │   └── email_collector.py
│   │   ├── models.py          # SQLAlchemy models + pgvector embeddings
│   │   ├── database.py        # PostgreSQL / SQLite dual support
│   │   └── main.py
│   └── requirements.txt
│
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx       # Dashboard
    │   │   ├── email/         # Inbox with detail modal
    │   │   ├── finance/       # Finance tracker
    │   │   └── agents/        # Agent logs & flows
    │   ├── contexts/
    │   │   └── AuthContext.tsx # Passkey auth context
    │   └── components/
    │       └── ui/glass/      # Design system
    └── package.json
```

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Email Agent (triage + categorization)
- [x] Finance Agent (transaction extraction)
- [x] LiteLLM multi-model support
- [x] IMAP email sync
- [x] Dashboard, Inbox, Finance, Agents UI
- [x] Agent execution logging + flow visualization
- [x] Docker environment with hot-reload

### Phase 2: SaaS Infrastructure ✅
- [x] Passkey authentication (WebAuthn)
- [x] Multi-tenancy (user-scoped data)
- [x] RAG system with pgvector
- [x] PostgreSQL migration

### Phase 3: Extended Agents
- [ ] Calendar Agent (event parsing)
- [ ] Investment Advisor (portfolio insights)
- [ ] Newsletter Curator (summarize dailies)

### Phase 4: Cloud Deployment
- [ ] Deploy to cloud (Fly.io / Railway)
- [ ] CI/CD pipeline
- [ ] Environment-based configuration

## 🏗️ Architecture Principles

1. **Model Agnostic**: Any LLM, any provider, swappable per-agent
2. **Agent Specialization**: Each agent excels in one domain
3. **Graceful Handoff**: Agents route work to the right specialist
4. **User in Control**: Review AI decisions before actions
5. **Privacy First**: Self-hostable, no telemetry

## 📄 License

MIT

---

**Built with ❤️ using FastAPI, Next.js, LiteLLM, PostgreSQL, and pgvector**
