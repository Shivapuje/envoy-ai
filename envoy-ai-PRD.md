# Envoy AI - Product Requirements Document

**Product Name:** Envoy AI  
**Version:** 0.2 (Multi-Agent Foundation)  
**Author:** Vinayak Shivapuje  
**Target User:** High-performance tech professionals  
**Last Updated:** January 31, 2026

---

## Problem Statement

Professionals have fragmented data (emails, bills, calendars). Existing tools are siloed. We need a unified "intelligence layer" that can:
- **Ingest** raw text/files from disparate sources
- **Normalize** them into structured data
- **Provide** cross-domain insights through specialized AI agents

---

## Product Vision

Envoy AI is a **Personal Chief of Staff** — a model-agnostic multi-agent orchestration platform where specialized AI agents work in harmony to automate personal workflows.

---

## Core Functional Requirements

### Story 1: Email Triage Agent ✅ IMPLEMENTED

| Aspect | Requirement | Status |
|--------|-------------|--------|
| **Input** | Raw email text from IMAP sync | ✅ Done |
| **Process** | AI classifies into categories (Urgent, Finance, Personal, Work, Newsletter) | ✅ Done |
| **Process** | Summarizes content | ✅ Done |
| **Process** | Assigns urgency score (1-10) | ✅ Done |
| **Process** | Identifies action items | ✅ Done |
| **Output** | Dashboard card view with filters | ✅ Done |
| **Output** | "Run Agent" button for manual control | ✅ Done |
| **Pending** | "Draft Reply" to trigger writer agent | 🚧 Future |

### Story 2: Finance Agent ✅ IMPLEMENTED

| Aspect | Requirement | Status |
|--------|-------------|--------|
| **Input** | Finance-category emails, SMS text | ✅ Done |
| **Process** | Extract {Amount, Vendor, Date, Type} | ✅ Done |
| **Process** | Skip zero-value transactions | ✅ Done |
| **Process** | Categorize (Shopping, Food, Bills, etc.) | ✅ Done |
| **Output** | Transaction table with stats | ✅ Done |
| **Output** | Manual entry for pasted SMS | ✅ Done |
| **Pending** | Budget rules with alerts | 🚧 Future |
| **Pending** | Cross-reference spending patterns | 🚧 Future |

### Story 3: Daily Planner 🚧 PLANNED

| Aspect | Requirement | Status |
|--------|-------------|--------|
| **Input** | Outputs from Email Agent (tasks) + Finance Agent (constraints) | 🚧 Planned |
| **Process** | "Staff Agent" synthesizes priorities | 🚧 Planned |
| **Process** | Consider calendar events | 🚧 Planned |
| **Output** | Markdown daily briefing | 🚧 Planned |
| **Output** | Actionable task list with deadlines | 🚧 Planned |

---

## Extended Agent Roster

### Future Agents

| Agent | Input | Process | Output | Priority |
|-------|-------|---------|--------|----------|
| **Calendar** | Email + calendar feeds | Extract events, meetings | Structured events | High |
| **Investment Advisor** | Portfolio data, market news | Analysis, recommendations | Daily briefing | Medium |
| **Tax Advisor** | Transactions, invoices | Track deductibles | Tax report | Medium |
| **Travel Planner** | Booking emails | Extract itineraries | Trip summaries | Medium |
| **Newsletter Curator** | Newsletter emails | Summarize, highlight | Daily digest | Low |
| **Bill Reminder** | Bill emails | Extract due dates | Notifications | High |
| **Meeting Prep** | Calendar events | Research attendees | Context brief | Low |
| **Contact Enricher** | New contacts | LinkedIn/company lookup | Contact cards | Low |

---

## Technical Requirements

### Multi-Agent Orchestration

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Model-agnostic architecture | LiteLLM integration | ✅ Done |
| Per-agent model configuration | MODEL_CONFIG dict | ✅ Done |
| Agent handoff (Email → Finance) | API-level routing | ✅ Done |
| Agent registry | Planned | 🚧 Future |
| Workflow engine | Planned | 🚧 Future |

### Supported LLM Providers

| Provider | Models | Status | Notes |
|----------|--------|--------|-------|
| Groq | Llama 3.3 70B | ✅ Default | Free tier, fastest |
| OpenAI | GPT-4o, GPT-3.5 | ✅ Ready | Requires API key |
| Anthropic | Claude 3 | ✅ Ready | Requires API key |
| Google | Gemini | ✅ Ready | Requires API key |
| Ollama | Local models | ✅ Ready | Self-hosted |

### Non-Functional Requirements

| Requirement | Target | Status |
|-------------|--------|--------|
| **Latency** | < 500ms for LLM calls | ✅ Achieved with Groq |
| **UI States** | "Processing..." indicators | ✅ Done |
| **Scalability** | Vertical Slice (feature folders) | ✅ Done |
| **Modularity** | AI Service decoupled from API | ✅ Done |
| **Privacy** | Local-first, no telemetry | ✅ Done |

---

## User Interface Requirements

### Dashboard ✅ IMPLEMENTED

- [x] Pending emails count (prominent CTA)
- [x] Transactions summary
- [x] Quick actions (Sync, Run Agent)
- [x] Recent activity feed
- [x] Agent status indicators

### Inbox ✅ IMPLEMENTED

- [x] Category filters (Pending, All, Finance, etc.)
- [x] Pending as default view
- [x] Email cards with AI summary
- [x] One-click agent processing
- [x] Empty state for zero pending

### Finance ✅ IMPLEMENTED

- [x] Transaction table (compact)
- [x] Stats row (Spent, Received, Count)
- [x] Category filters
- [x] Manual entry form

### Planner 🚧 PLANNED

- [ ] Daily briefing markdown
- [ ] Task list with priorities
- [ ] Calendar integration
- [ ] Cross-agent synthesis

---

## Design Requirements

### Visual Style

- Dark glassmorphism theme
- Primary background: `#0f0716`
- Accent color: Violet (`#7c3aed`)
- Consistent spacing and typography
- Minimal, professional aesthetic

### Sidebar

- Fixed width (64px)
- Icon-only navigation
- Tooltips on hover
- No expand animation (professional preference)

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Emails processed per day | 100+ | ✅ Capable |
| Agent response time | < 2s | ✅ ~500ms |
| User actions saved | 50%+ | Measuring |
| False categorization rate | < 10% | Measuring |

---

## Roadmap

### v0.1 ✅ COMPLETE
- Email sync and triage
- Finance extraction
- Basic dashboard

### v0.2 🔄 IN PROGRESS
- Agent handoff (Email → Finance)
- Improved UI consistency
- Documentation

### v0.3 PLANNED
- Calendar Agent
- Bill Reminder Agent
- Workflow triggers

### v0.4 PLANNED
- Investment Advisor
- Tax Advisor
- Agent configuration UI

### v1.0 VISION
- Full multi-agent orchestration
- Voice interface
- Mobile app
- Browser extension

---

*This PRD is a living document. Updated regularly as features ship.*