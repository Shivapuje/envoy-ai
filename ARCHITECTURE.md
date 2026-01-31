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
│   Dashboard          │   Inbox            │   Finance       │  Planner  │
│   (page.tsx)         │   (email/page.tsx) │   (finance/)    │  (TBD)    │
├─────────────────────────────────────────────────────────────────────────┤
│                              REST API                                    │
│                          (HTTP/JSON)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                     │
│                         (FastAPI + Python)                               │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│   API Layer      │   Service Layer  │   Agent Layer    │   Data Layer   │
│   /api/email.py  │   ai_engine.py   │   email/agent    │   SQLite DB    │
│   /api/finance   │   email_collector│   finance/agent  │   models.py    │
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
- Error handling and fallbacks

**Key Pattern: Per-Agent Model Configuration**

```python
MODEL_CONFIG = {
    "email_triage": "groq/llama-3.3-70b-versatile",
    "finance": "groq/llama-3.3-70b-versatile", 
    "calendar": "openai/gpt-4o",  # Future
}
```

This allows each agent to use the most suitable model for its task.

### 2. Agents (`features/{domain}/agent.py`)

Specialized AI workers built with CrewAI framework.

**Email Triage Agent**
- Input: Raw email text
- Output: Category, summary, urgency score, action items
- Model: Groq/Llama (fast, free)

**Finance Agent**
- Input: Finance-related email text
- Output: Amount, vendor, date, transaction type
- Model: Groq/Llama (accurate extraction)

**Agent Communication Pattern:**

```
Email Agent detects category="Finance"
        ↓
API Layer routes to Finance Agent
        ↓
Finance Agent extracts transaction
        ↓
Transaction saved to database
```

### 3. Email Collector (`services/email_collector.py`)

IMAP client that syncs emails to local database.

**Optimization Techniques:**
- Pre-loads existing message IDs in one query (O(1) duplicate check)
- Limits batch size (100 emails per sync)
- Silent skip for duplicates (no log spam)

### 4. Database Models (`models.py`)

SQLite-backed persistence using SQLAlchemy.

**Email**
- `message_id`: Unique IMAP ID
- `processing_status`: pending | processed | failed | skipped
- `ai_analysis`: JSON blob of agent output

**Transaction**
- `email_message_id`: Link to source email
- `amount`, `merchant`, `category`: Extracted data
- `transaction_type`: debit | credit

---

## Design Patterns

### Model-Agnostic via LiteLLM

All LLM calls go through LiteLLM, enabling:
- Unified API across providers
- Easy model swapping per-agent
- Fallback chains (try Groq, fallback to OpenAI)

```python
import litellm
response = litellm.completion(
    model="groq/llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": prompt}]
)
```

### Agent Handoff Pattern

When Email Agent detects a specialized category:

```python
# In email API
if category == "finance":
    finance_result = _process_finance_email(db, ai_engine, email, text)
    analysis["finance_data"] = finance_result
```

This pattern will extend to Calendar, Investment, etc.

### Progressive Enhancement

UI works without AI:
1. **Sync**: Emails fetched and stored (no AI needed)
2. **Manual trigger**: User clicks "Run Agent" to process
3. **Auto-process**: Background job processes new emails (future)

---

## UI Design System

### Color Palette

```css
--bg-primary: #0f0716      /* Deep purple-black */
--bg-card: #130b1c         /* Slightly lighter */
--accent-primary: #7c3aed  /* Violet 600 */
--text-primary: #f1f5f9    /* Slate 100 */
--text-secondary: #64748b  /* Slate 500 */
```

### Component Hierarchy

```
Layout (Sidebar + Content)
├── Sidebar (fixed, icon-only, 64px)
├── Dashboard
│   ├── Task Cards (Pending Emails, Transactions)
│   ├── Quick Actions (Sync, Run Agent)
│   ├── Recent Activity (Emails, Transactions)
│   └── Agent Status Cards
├── Inbox
│   ├── Header (title, sync status, toolbar)
│   ├── Category Filters (Pending, All, Finance, etc.)
│   └── Email Grid (GlassCard per email)
└── Finance
    ├── Stats Row (Spent, Received, Count)
    ├── Category Filters
    └── Transaction Table
```

### Glass Components

Reusable UI primitives in `/components/ui/glass/`:
- `GlassCard`: Container with backdrop blur
- `GlassButton`: Glowing action buttons
- `GlassInput`: Styled input fields

---

## API Design

### Email Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/email/sync` | Fetch emails from IMAP |
| POST | `/api/email/analyze-pending` | Run Email Agent on pending |
| POST | `/api/email/analyze/{id}` | Process single email |
| GET | `/api/email/list` | List emails (pending first) |

### Finance Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/finance/transactions` | List transactions |
| POST | `/api/finance/parse` | Manual text parsing |

### Response Patterns

All endpoints return consistent shapes:

```json
{
  "status": "success",
  "data": { ... },
  "analyzed_count": 5,
  "results": [ { "id": 1, "status": "success" } ]
}
```

---

## Future Architecture

### Agent Registry

```python
AGENT_REGISTRY = {
    "email_triage": EmailTriageAgent,
    "finance": FinanceAgent,
    "calendar": CalendarAgent,
    "investment": InvestmentAdvisorAgent,
    "tax": TaxAdvisorAgent,
}
```

### Workflow Engine

```yaml
workflows:
  - name: "Finance Email Processing"
    trigger: "email.category == 'Finance'"
    steps:
      - agent: "finance"
        action: "extract_transaction"
      - agent: "tax"  
        action: "check_deductible"
        if: "transaction.category == 'Business'"
```

### Multi-Agent Communication

```python
class AgentBus:
    def route(self, message: AgentMessage):
        target = self.registry.get(message.target_agent)
        return target.process(message.payload)
```

---

## Security Considerations

1. **API Keys**: Stored in `.env`, never committed
2. **Email Credentials**: App-specific passwords recommended
3. **Local-First**: All data stays on user's machine
4. **No Telemetry**: No data sent to external services

---

## Performance Optimizations

1. **Email Sync**: Pre-load IDs, batch commits
2. **API Responses**: Pending emails first (user sees work to do)
3. **Frontend**: React Query for caching, optimistic updates
4. **LLM Calls**: Groq for speed (< 500ms typical)

---

*Last updated: January 31, 2026*
