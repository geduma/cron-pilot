# CronPilot

Self-hosted web app for scheduling and monitoring HTTP jobs.

## Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, React Query, Axios
- **Backend:** Node.js, Fastify, TypeScript
- **Database:** SQLite (via better-sqlite3)
- **Auth:** Geduma Auth (external OAuth service)

## Setup

```bash
npm run setup
```

Copy and configure environment variables:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

## Development

```bash
npm run dev
```

Single service on `http://localhost:3000`. The backend compiles the frontend and serves it.

## Build

```bash
npm run build
```

## Production

```bash
npm run start
```

The backend serves both the API and the frontend static files.

## Project Structure

```
cron-pilot/
├── frontend/          # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── types/
├── src/               # Fastify API
│   ├── routes/
│   ├── services/
│   ├── plugins/
│   └── types/
├── data/              # SQLite database (gitignored)
└── docs/
```

## Database

SQLite file at `./data/cronpilot.db`. Auto-created on first run.

Tables: `jobs`, `job_executions`.
