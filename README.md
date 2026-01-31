# Envoy AI

**Your Personal Chief of Staff** — An AI-powered workspace that orchestrates multiple specialized agents to manage your digital life.

**Author:** Vinayak Shivapuje

## 🎯 Vision

Envoy AI is a **model-agnostic multi-agent orchestration platform** where specialized AI agents work together in harmony. Each agent is an expert in its domain — triaging emails, extracting financial data, managing calendars, advising on investments — and they communicate seamlessly to automate complex workflows.

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
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Inbox     │    │  Finance    │    │  Planner    │        │
│   │   (UI)      │    │   (UI)      │    │   (UI)      │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🤖 Multi-Agent Orchestration

| Agent | Model | Purpose | Status |
|-------|-------|---------|--------|
| **Email Triage** | Groq (Llama 3.3 70B) | Categorize, summarize, extract action items | ✅ Active |
| **Finance** | Groq (Llama 3.3 70B) | Extract transactions from bank emails | ✅ Active |
| **Calendar** | *Configurable* | Parse events, schedule meetings | 🚧 Planned |
| **Investment Advisor** | *Configurable* | Portfolio analysis, market insights | 🚧 Planned |
| **Tax Advisor** | *Configurable* | Tax-related email classification, deduction tracking | 🚧 Planned |
| **Travel Planner** | *Configurable* | Itinerary extraction, booking confirmations | 🚧 Planned |
| **Newsletter Curator** | *Configurable* | Summarize, highlight key articles | 🚧 Planned |
| **Bill Reminder** | *Configurable* | Due date extraction, payment alerts | 🚧 Planned |

### 🧠 Model-Agnostic Architecture

Powered by **LiteLLM**, Envoy supports any LLM provider with a unified API:

```python
MODEL_CONFIG = {
    "email_triage": "groq/llama-3.3-70b-versatile",  # Fast, free
    "finance": "groq/llama-3.3-70b-versatile",       # Accurate extraction
    "calendar": "openai/gpt-4o",                      # Complex reasoning
    "investment": "anthropic/claude-3-opus",          # Deep analysis
}
```

**Supported Providers:**
- ✅ Groq (Free, fast inference)
- ✅ OpenAI (GPT-4o, GPT-3.5)
- ✅ Anthropic (Claude 3)
- ✅ Google (Gemini)
- ✅ Local models via Ollama
- ✅ 100+ more via LiteLLM

### 🔄 Agent Communication

Agents hand off work to each other:

```
Email arrives → Email Agent categorizes as "Finance"
                     ↓
              Finance Agent extracts transaction
                     ↓
              Transaction saved to database
                     ↓
              Dashboard updated in real-time
```

### 🎨 Modern UI

- **Dark glassmorphism design** with consistent theming
- **Dashboard** with pending tasks, quick actions, agent status
- **Inbox** with category filters, pending/processed views
- **Finance tracker** with transaction table, stats
- **Responsive** sidebar navigation

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your GROQ_API_KEY to .env

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

**Open:** http://localhost:3000

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
```

## 📁 Project Structure

```
envoy-ai/
├── backend/
│   ├── app/
│   │   ├── api/              # REST endpoints
│   │   │   ├── email.py      # Email sync, analyze
│   │   │   └── finance.py    # Transactions
│   │   ├── core/             # Config, models
│   │   ├── features/         # Agent implementations
│   │   │   ├── email/agent.py
│   │   │   └── finance/agent.py
│   │   ├── services/
│   │   │   ├── ai_engine.py  # LiteLLM orchestration
│   │   │   └── email_collector.py
│   │   └── main.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Dashboard
    │   │   ├── email/        # Inbox
    │   │   └── finance/      # Finance tracker
    │   └── components/
    │       ├── layout/sidebar.tsx
    │       └── ui/glass/     # Design system
    └── package.json
```

## 🔧 Adding a New Agent

1. **Create the agent** in `backend/app/features/`:

```python
# backend/app/features/calendar/agent.py
from crewai import Agent, Task, Crew

def create_calendar_agent():
    return Agent(
        role="Calendar Manager",
        goal="Extract events, dates, and scheduling info",
        backstory="Expert at parsing meeting invites and calendar events",
        verbose=True
    )
```

2. **Register in AI Engine**:

```python
# backend/app/services/ai_engine.py
MODEL_CONFIG = {
    # ... existing
    "calendar": "openai/gpt-4o",
}

def run_calendar_agent(self, text: str) -> dict:
    # Implementation
```

3. **Add API endpoint**:

```python
# backend/app/api/calendar.py
@router.post("/parse-event")
async def parse_event(text: str):
    return ai_engine.run_calendar_agent(text)
```

4. **Create frontend page**:

```tsx
// frontend/src/app/planner/page.tsx
export default function PlannerPage() {
  // Implementation
}
```

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Email Agent (triage + categorization)
- [x] Finance Agent (transaction extraction)
- [x] LiteLLM multi-model support
- [x] IMAP email sync
- [x] Dashboard with live stats

### Phase 2: Extended Agents
- [ ] Calendar Agent (event parsing)
- [ ] Investment Advisor (portfolio insights)
- [ ] Tax Advisor (deduction tracking)
- [ ] Travel Planner (itinerary extraction)

### Phase 3: Advanced Orchestration
- [ ] Agent-to-agent communication
- [ ] Workflow automation (if X then Y)
- [ ] User-defined custom agents
- [ ] Voice interface integration

### Phase 4: Intelligence Layer
- [ ] Learning from user preferences
- [ ] Proactive suggestions
- [ ] Cross-agent insights
- [ ] RAG over personal data

## 🏗️ Architecture Principles

1. **Model Agnostic**: Any LLM, any provider, swappable per-agent
2. **Agent Specialization**: Each agent excels in one domain
3. **Graceful Handoff**: Agents route work to the right specialist
4. **User in Control**: Review AI decisions before actions
5. **Privacy First**: Local-first, self-hostable

## 📄 License

MIT

---

**Built with ❤️ using FastAPI, Next.js, LiteLLM, and CrewAI**
