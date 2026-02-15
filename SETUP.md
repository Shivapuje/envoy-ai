# Envoy AI - Setup Guide

**Author:** Vinayak Shivapuje

Complete setup guide for running Envoy AI locally.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |

**For local dev without Docker:**

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |

---

## Quick Start — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — add your API keys (see below)

# 3. Start all services
docker compose up --build

# 4. Open browser
open http://localhost:3000
```

**Services started:**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js UI |
| Backend | http://localhost:8000 | FastAPI API |
| API Docs | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | localhost:5432 | Database (pgvector) |

---

## Quick Start — Local Dev (No Docker)

```bash
# 1. Clone
git clone https://github.com/your-username/envoy-ai.git
cd envoy-ai

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — add your API keys

# 4. Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 6. Open browser
open http://localhost:3000
```

> **Note:** Local dev uses SQLite. Docker uses PostgreSQL with pgvector for RAG.

---

## Environment Variables

Edit `backend/.env` with your configuration:

```env
# ===========================================
# LLM PROVIDERS (At least one required)
# ===========================================

# Groq (RECOMMENDED - Free tier, fastest)
# Get key at: https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# OpenAI (Optional, used for credit card agent)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# Anthropic (Optional)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# ===========================================
# EMAIL CONFIGURATION (For IMAP sync)
# ===========================================

IMAP_SERVER=imap.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password

# ===========================================
# AUTHENTICATION
# ===========================================

# Set to true to bypass passkey auth (development)
DISABLE_AUTH=true

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# WebAuthn
RP_ID=localhost
RP_NAME=Envoy AI
RP_ORIGIN=http://localhost:3000

# ===========================================
# DATABASE (auto-configured by Docker)
# ===========================================

# Uncomment for PostgreSQL (Docker sets this automatically)
# DATABASE_URL=postgresql://envoy:envoy@localhost:5432/envoy_ai
```

### Gmail App Password

For Gmail IMAP sync, you need an **App Password**:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords**
4. Select "Mail" and "Other (Custom name)"
5. Enter "Envoy AI" and click **Generate**
6. Copy the 16-character password to `EMAIL_PASS`

---

## Verify Installation

### Docker

```bash
# Check all services are healthy
docker compose ps

# Backend health
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Frontend
open http://localhost:3000
```

### Local Dev

```bash
# Backend health
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs

# Frontend
open http://localhost:3000
```

---

## Database

### Docker (PostgreSQL + pgvector)

Docker Compose uses `pgvector/pgvector:pg16` with the vector extension pre-installed. Data is persisted in a `postgres-data` Docker volume.

```bash
# Connect to database
docker compose exec postgres psql -U envoy -d envoy_ai

# Reset database (delete volume)
docker compose down -v
docker compose up --build
```

### Local Dev (SQLite)

SQLite database is created automatically at `backend/envoy_ai.db`.

```bash
# Reset database
cd backend
rm envoy_ai.db
# Restart backend to recreate
```

---

## Docker Commands

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f postgres

# Restart a single service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove all data
docker compose down -v
```

---

## Common Issues

### Issue: `ModuleNotFoundError`

```bash
# Local dev: ensure venv is activated
source venv/bin/activate
pip install -r requirements.txt

# Docker: rebuild
docker compose build --no-cache backend
```

### Issue: Backend can't connect to PostgreSQL

```bash
# Check postgres is running and healthy
docker compose ps postgres

# Check logs
docker compose logs postgres
```

### Issue: Port already in use

```bash
# Kill existing process
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill

# Or use different port
uvicorn app.main:app --port 8001
```

### Issue: Frontend can't connect to backend

1. Ensure backend is running on port 8000
2. Check for CORS issues in browser console
3. Verify `NEXT_PUBLIC_API_URL=http://localhost:8000` in frontend env

### Issue: Passkey registration fails

1. Ensure `RP_ID=localhost` and `RP_ORIGIN=http://localhost:3000`
2. Use HTTPS in production (WebAuthn requires secure context)
3. Set `DISABLE_AUTH=true` to bypass auth in development

---

## Development Tips

### Hot Reload

- **Docker backend**: Auto-reloads via `watchfiles` when source code changes
- **Docker frontend**: Auto-reloads via Next.js polling (`WATCHPACK_POLLING=true`)
- **Local backend**: Use `--reload` flag with uvicorn
- **Local frontend**: Next.js dev server has HMR built-in

### Auto Recovery

Docker services use `restart: unless-stopped` + health checks. If a service crashes, Docker will automatically restart it.

---

*Last updated: February 16, 2026*
