# AGENTS.md - CronPilot

Guidelines for AI agents working on this codebase.

---

## Project Overview

CronPilot is a self-hosted web app for scheduling and monitoring HTTP jobs. Monorepo with frontend + backend.

**Stack:**
- Frontend: React 18, Vite, TypeScript, TailwindCSS, React Query, React Router, Axios
- Backend: Node.js, Fastify, TypeScript
- Database: SQLite (file-based, zero config)
- Auth: Geduma Auth (external OAuth service, GitHub provider)

---

## Repository Structure

```
cron-pilot/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # UI components (ui/, layout/, auth/, dashboard/, jobs/, history/)
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks (useAuth, useJobs)
│   │   ├── services/      # API calls (api.ts, auth.ts)
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Helpers
│   └── .env
├── src/                   # Fastify API
│   ├── routes/            # API endpoints (jobs.ts, dashboard.ts)
│   ├── services/          # Business logic (scheduler.ts)
│   ├── plugins/           # Fastify plugins (auth.ts, db.ts)
│   ├── types/             # TypeScript types
│   └── utils/             # Helpers, migrations
├── data/                  # SQLite database (gitignored)
├── docs/                  # Documentation
│   ├── specification-v1.0.md
│   ├── cron-pilot-api-spec.md
│   ├── implementation-plan.md
│   ├── PRD.md
│   └── AGENTS.md
├── nginx.conf
├── package.json
└── tsconfig.json
```

---

## Commands

```bash
# Setup
npm run setup              # Install all dependencies

# Development
npm run dev                # Run backend + frontend
npm run dev:backend        # Run only backend (port 3000)
npm run dev:frontend       # Run only frontend (port 5173)

# Build
npm run build              # Build frontend + backend
npm run build:frontend     # Build only frontend
npm run build:backend      # Build only backend

# Database
npm run migrate            # Run SQLite migrations

# Production
npm run start              # Start compiled backend
```

---

## Code Conventions

### General
- All code in English (variables, functions, comments, UI text)
- Chat with user in Spanish
- TypeScript strict mode
- No comments unless requested

### Frontend
- Mobile-first responsive design
- TailwindCSS for styling
- React Query for server state
- React Router for navigation
- Components in `src/components/` organized by domain
- Pages in `src/pages/`

### Backend
- Fastify plugins for modular routes
- Auth middleware validates Geduma session tokens
- All API responses follow `{ success, data, message }` format
- Scheduler runs in-process (no separate workers)

---

## Auth Flow

1. Frontend fetches GitHub provider from Geduma Auth
2. User clicks login → redirected to GitHub OAuth
3. GitHub callback → Geduma Auth redirects to `/auth/callback#session_token=xxx`
4. Frontend exchanges session token for user data
5. Backend validates session token on every API request

**App ID:** `app_mrjlwiq7sdny2i`

---

## API Response Format

Success:
```json
{ "success": true, "data": {}, "message": "" }
```

Error:
```json
{ "success": false, "message": "Error description" }
```

---

## Database

**Engine:** SQLite via better-sqlite3

**File location:** `./data/cronpilot.db`

**Tables:**
- `jobs` - Scheduled HTTP jobs
- `job_executions` - Execution history

**Key fields:**
- `user_id` - Email from Geduma session (used for data isolation)
- `next_execution` - Used by scheduler to detect pending jobs
- `enabled` - Toggle job on/off (INTEGER: 1 or 0)

**Notes:**
- Dates stored as TEXT (ISO 8601)
- Booleans stored as INTEGER (0 or 1)
- Headers stored as JSON string

---

## Scheduler Behavior

- Runs every 60 seconds
- Queries `jobs WHERE enabled=1 AND next_execution <= datetime('now')`
- Executes HTTP request with 30s timeout
- Saves result in `job_executions`
- Updates `last_execution` and calculates new `next_execution`

---

## Deployment

Single server with Nginx:
- Nginx serves frontend static files from `frontend/dist/`
- Nginx proxies `/api/*` to Node.js backend (port 3000)
- Backend serves as systemd service or PM2
- SQLite database file persists in `data/` directory

---

## Important Notes

- No dark mode in MVP
- No cron expressions (fixed frequencies only)
- No response headers stored (simplification)
- Timeout: 30 seconds default per job
- Data isolation: each user sees only their own jobs
- SQLite = zero config, file-based, self-contained
