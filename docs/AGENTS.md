# AGENTS.md - CronPilot

Guidelines for AI agents working on this codebase.

---

## Project Overview

CronPilot is a self-hosted web app for scheduling and monitoring HTTP jobs. Monorepo with frontend + backend.

**Stack:**
- Frontend: React 19, Vite, TypeScript, TailwindCSS, React Query, React Router, Axios
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
│   ├── routes/            # API endpoints (jobs.ts, dashboard.ts, auth.ts)
│   ├── services/          # Business logic (scheduler.ts)
│   ├── plugins/           # Fastify plugins (auth.ts, db.ts)
│   ├── types/             # TypeScript types
│   └── utils/             # Helpers, migrations
├── data/                  # SQLite database (gitignored)
├── docs/                  # Documentation
│   ├── specification-v1.0.md
│   ├── implementation-plan.md
│   ├── PRD.md
│   └── AGENTS.md
├── .env                   # Local environment variables
├── .env.docker            # Docker environment variables
├── .env.example           # Environment template
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose config
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

# Docker
docker compose up -d --build   # Build and run in Docker
docker compose down            # Stop containers
docker compose logs -f         # View logs
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_PATH` | `./data/cronpilot.db` | SQLite file path |
| `GEDUMA_API_URL` | `https://api.geduma.com` | Geduma Auth API URL |

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
- `mapRowToCamel` converts snake_case DB columns to camelCase for JS objects

---

## Auth Flow

1. Frontend redirects to Geduma Auth (`/api/auth/session`)
2. Backend validates session token against Geduma API
3. User data cached in memory (`sessionCache` Map)
4. Backend returns user data to frontend
5. Token stored in `localStorage`, sent as `Authorization: Bearer <token>` on every request

**App ID:** `app_mrjlwiq7sdny2i`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/session` | Validate session token, return user data |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/:id` | Get job by ID |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job (cascades to executions) |
| POST | `/api/jobs/:id/run` | Execute job manually |
| POST | `/api/jobs/test` | Test run without saving |
| GET | `/api/jobs/:id/history` | Get execution history |
| DELETE | `/api/jobs/:id/history` | Clear execution history |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

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
- Dates stored as TEXT (`datetime('now')` = UTC)
- Booleans stored as INTEGER (0 or 1)
- Headers stored as JSON string
- `ON DELETE CASCADE` — deleting a job removes its executions
- `mapRowToCamel` converts snake_case DB columns to camelCase

**Critical:** SQLite `datetime('now')` stores UTC. Frontend must append `Z` when parsing with `new Date()` to display correct local time.

---

## Scheduler Behavior

- Runs every 60 seconds
- Queries `jobs WHERE enabled=1 AND next_execution <= datetime('now')`
- Executes HTTP request with 30s timeout
- Saves result in `job_executions`
- Updates `last_execution` and calculates new `next_execution`

---

## Frontend Features

### JobsTable
- Search filter (name, URL, method)
- Client-side pagination (10 per page)
- `showActions` prop — `false` for dashboard, `true` for jobs page
- Color-coded action buttons: Run (green), Edit (gray), Delete (red)

### HistoryTable
- Filter buttons: All, 24h, 7d, 30d
- Expandable rows — click to view response body
- Pagination

### JobForm
- Toggle switch for active/paused status
- Test Run button (executes without saving, logs full result to console)
- Toast shows HTTP status, duration, error details, and response body preview

### Toast System
- `ToastProvider` wraps app in `App.tsx`
- `useToast()` hook — `toast.success()`, `toast.error()`
- Auto-dismiss: 4s for success/info, 8s for errors
- Supports multiline messages (`whitespace-pre-line`)
- Dashboard error card links to `/jobs`

---

## Deployment

### Docker (Recommended)
```bash
docker compose up -d --build
```
- Maps port `3001:3000`
- Uses `.env.docker` config
- Volume persists SQLite data
- Backend serves frontend static files

### Manual
```bash
npm run build
npm run start
```

No nginx needed — backend serves everything via `@fastify/static`.

---

## Important Notes

- No dark mode in MVP
- No cron expressions (fixed frequencies only)
- No response headers stored (simplification)
- Timeout: 30 seconds default per job
- Data isolation: each user sees only their own jobs
- SQLite = zero config, file-based, self-contained
