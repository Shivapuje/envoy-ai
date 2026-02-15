# Envoy AI - Project Context

**Author:** Vinayak Shivapuje

## What is Envoy AI?

Envoy AI is your **Personal Chief of Staff** — an AI-powered assistant that manages your digital life by orchestrating specialized agents. Instead of one AI trying to do everything, Envoy uses expert agents that collaborate:

- **Email Agent** triages your inbox
- **Finance Agent** extracts transactions from bank emails
- **Calendar Agent** parses meeting invites *(coming soon)*
- **Investment Advisor** analyzes your portfolio *(coming soon)*
- And more...

## Current State (v0.1)

### Working Features

✅ **Email Sync**
- Connects to any IMAP server (Gmail, Outlook, etc.)
- Fetches emails and stores locally
- Duplicate detection for fast re-sync

✅ **Email Agent**
- Categorizes emails (Finance, Personal, Work, Newsletter, etc.)
- Generates summaries
- Assigns urgency scores
- Identifies action items

✅ **Finance Agent**
- Auto-triggered for Finance-category emails
- Extracts: amount, vendor, date, transaction type
- Creates transaction records
- Skips 0-value emails (balance inquiries, etc.)

✅ **Dashboard**
- Live pending email count
- Quick Sync & Run Agent buttons
- Recent activity feed
- Agent status indicators

✅ **Inbox UI**
- Category filters (Pending first as default)
- Card-based email display
- One-click agent processing
- Empty state for zero pending
- Email detail modal with full content and attachments

✅ **Finance UI**
- Transaction table
- Stats summary (spent, received, count)
- Category filters
- Manual entry support

✅ **Agents Page**
- Agent configuration viewer with prompts
- Execution logs with timing and status
- Flow visualization showing agent handoffs
- Model configuration display
- Execution statistics (success rate, avg duration)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, SQLAlchemy, SQLite |
| AI/LLM | LiteLLM (Groq as default), CrewAI |
| Email | IMAP via imap-tools |

### Why Groq?

- **Free tier** with generous limits
- **Fastest inference** (< 500ms)
- **Quality models** (Llama 3.3 70B)
- Easy to switch to OpenAI/Anthropic later

## Design Philosophy

### 1. Model Agnostic

Each agent can use a different LLM provider:
```
Email Agent → Groq (fast, free)
Finance Agent → Groq (accurate)
Investment Agent → Anthropic Claude (deep analysis)
```

### 2. Agent Specialization

One agent, one job. The Email Agent doesn't try to extract transactions — it hands off to the Finance Agent.

### 3. User in Control

AI suggests, user confirms. No auto-actions that can't be undone.

### 4. Privacy First

- All data stays local
- Self-hostable
- No telemetry

## Future Agents

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **Calendar** | Parse events, create reminders | email.category == "Calendar" |
| **Investment Advisor** | Portfolio analysis, market news | Manual or scheduled |
| **Tax Advisor** | Track deductibles, categorize expenses | transaction.category check |
| **Travel Planner** | Itinerary extraction | email.subject contains "booking" |
| **Newsletter Curator** | Summarize daily newsletters | email.category == "Newsletter" |
| **Bill Reminder** | Due date alerts | email.subject contains "bill", "due" |
| **Meeting Prep** | Research attendees, summarize context | calendar.event.upcoming |
| **Contact Enricher** | LinkedIn/company research | New contact detected |

## How Agents Will Communicate

```
User receives email about flight booking
        ↓
Email Agent → Category: "Travel"
        ↓
Travel Agent → Extract: dates, flight#, confirmation
        ↓
Calendar Agent → Create event with details
        ↓
Meeting Prep Agent → Research destination
        ↓
Notification → "Trip to NYC added, 3 meetings scheduled"
```

## Configuration Vision

Users will be able to customize agents via YAML:

```yaml
agents:
  email_triage:
    model: groq/llama-3.3-70b-versatile
    enabled: true
    
  finance:
    model: groq/llama-3.3-70b-versatile
    enabled: true
    auto_trigger_on:
      - email.category == "Finance"
    
  calendar:
    model: openai/gpt-4o
    enabled: false  # Coming soon
    
  investment:
    model: anthropic/claude-3-opus
    schedule: "daily at 9am"
    portfolio_api: alpaca
```

## Development Priorities

### Short Term
1. ~~Fix pending email ordering~~ (done)
2. ~~Add empty states~~ (done)
3. ~~Agent execution logging~~ (done)
4. ~~Email detail modal~~ (done)
5. Calendar Agent MVP
6. Better error handling

### Medium Term
1. Agent configuration UI
2. Workflow builder
3. Notification system
4. Mobile-responsive improvements

### Long Term
1. Voice interface
2. Browser extension
3. RAG over personal data
4. Learning from user behavior

---

*This document reflects the state as of February 15, 2026*