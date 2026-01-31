# Envoy AI - Setup Guide

**Author:** Vinayak Shivapuje

Complete setup guide for running Envoy AI locally.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any | `git --version` |

---

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and add your API keys (see below)

# 4. Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 6. Open browser
open http://localhost:3000
```

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai
```

### Step 2: Backend Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# ===========================================
# LLM PROVIDERS (At least one required)
# ===========================================

# Groq (RECOMMENDED - Free tier, fastest)
# Get key at: https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# OpenAI (Optional)
# Get key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# Anthropic (Optional)
# Get key at: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Google (Optional)
# Get key at: https://aistudio.google.com
GOOGLE_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# ===========================================
# EMAIL CONFIGURATION (For IMAP sync)
# ===========================================

IMAP_SERVER=imap.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password

# ===========================================
# DATABASE
# ===========================================

DATABASE_URL=sqlite:///./envoy.db
```

### Step 4: Email App Password (Gmail)

For Gmail, you need an **App Password** (not your regular password):

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords**
4. Select "Mail" and "Other (Custom name)"
5. Enter "Envoy AI" and click **Generate**
6. Copy the 16-character password to `EMAIL_PASS`

### Step 5: Start Backend

```bash
# From backend directory with venv activated
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Verify it's running:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Step 6: Frontend Setup

```bash
# New terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 7: Open Application

Navigate to: **http://localhost:3000**

---

## Verify Installation

### Backend Health

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### Frontend Running

Open http://localhost:3000 and verify:
- ✅ Dashboard loads
- ✅ Sidebar navigation works
- ✅ No console errors

### Email Sync Test

1. Click **Sync Inbox** on dashboard
2. Check terminal for connection logs
3. Emails should appear in Inbox

### Agent Test

1. Click **Run Agent** 
2. Watch terminal for LLM calls
3. Emails should show categories and summaries

---

## Common Issues

### Issue: `ModuleNotFoundError`

```bash
# Ensure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: `GROQ_API_KEY not found`

```bash
# Check .env file exists
cat .env | grep GROQ

# Ensure no spaces around =
GROQ_API_KEY=gsk_xxx  # Correct
GROQ_API_KEY = gsk_xxx  # Wrong
```

### Issue: Email sync fails

```
Error connecting to email server
```

**Solutions:**
1. Verify IMAP server is correct (Gmail: `imap.gmail.com`)
2. Use App Password, not regular password
3. Enable "Less secure app access" or use App Password
4. Check firewall allows port 993

### Issue: Port already in use

```bash
# Kill existing process
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill

# Or use different port
uvicorn app.main:app --port 8001
```

### Issue: Frontend can't connect to backend

```
Error fetching emails: TypeError: Failed to fetch
```

**Solutions:**
1. Ensure backend is running on port 8000
2. Check for CORS issues in browser console
3. Backend URL is hardcoded as `http://localhost:8000`

---

## Development Setup

### Running Both Services

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Database Reset

```bash
cd backend
rm envoy.db
# Restart backend to recreate
```

### Clear All Data

```bash
cd backend
source venv/bin/activate
python -c "
from sqlalchemy import text
from app.database import SessionLocal
db = SessionLocal()
db.execute(text('DELETE FROM emails'))
db.execute(text('DELETE FROM transactions'))
db.execute(text('DELETE FROM processed_emails'))
db.commit()
print('All data cleared')
"
```

---

## Production Deployment

### Backend (Docker)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

### Environment Variables (Production)

Set in your hosting platform:
- `GROQ_API_KEY`
- `IMAP_SERVER`
- `EMAIL_USER`
- `EMAIL_PASS`
- `DATABASE_URL` (use PostgreSQL for production)

---

## Support

- **Issues**: Open a GitHub issue
- **Questions**: Discussions tab
- **Contributions**: PRs welcome!

---

*Last updated: January 31, 2026*
