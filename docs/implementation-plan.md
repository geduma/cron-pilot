# CronPilot - Implementation Plan

## Project Overview

CronPilot is a web application for creating, executing, and monitoring scheduled HTTP jobs.

## Architecture

```
Frontend (cron-pilot-web)     Backend (cron-pilot-api)
         │                              │
    Azure Static Web App          Separate Repo
         │                              │
         └──────── REST API ────────────┘
                        │
                 Supabase PostgreSQL
```

## Repositories

| Repository | Description | Deploy |
|------------|-------------|--------|
| cron-pilot-web | React Frontend | Azure Static Web App |
| cron-pilot-api | Fastify Backend | Separate infrastructure |

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router v6
- React Query (TanStack Query)
- TailwindCSS (mobile-first)
- Axios

### Backend
- Node.js
- Fastify
- TypeScript
- Supabase PostgreSQL

### Authentication
- Geduma Auth (external)
- Provider: GitHub only
- App ID: `app_cronpilot_7x9k2m`

## Implementation Phases

### Phase 1: Frontend Setup
1. Initialize Vite project
2. Configure TailwindCSS
3. Setup project structure
4. Configure environment variables

### Phase 2: Authentication
1. Integrate Geduma Auth
2. Create auth callback handler
3. Implement protected routes
4. Store session in context

### Phase 3: API Layer
1. Create Axios instance
2. Define TypeScript types
3. Create API service functions
4. Setup React Query hooks

### Phase 4: UI Components
1. Layout components (Navbar, Sidebar)
2. Dashboard components (StatsCards, JobsTable)
3. Job components (JobForm, JobCard)
4. History components (HistoryTable)
5. Shared components (Button, Input, Modal, Badge)

### Phase 5: Pages
1. Dashboard page
2. Jobs list page
3. Create/Edit Job page
4. Job History page

### Phase 6: Mobile Optimization
1. Responsive navbar
2. Mobile-friendly tables
3. Touch-friendly forms
4. Bottom navigation (optional)

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_GEDUMA_API_URL=http://localhost:3000
VITE_GEDUMA_APP_ID=app_cronpilot_7x9k2m
```

### Backend (.env)
```
PORT=3000
DATABASE_URL=postgresql://xxx:xxx@xxx:5432/cronpilot
GEDUMA_API_URL=http://localhost:3000
```

## Database Schema

See cron-pilot-api-spec.md for complete schema.

### Tables
- jobs
- job_executions

### Indexes
- idx_jobs_user_id
- idx_jobs_next_execution
- idx_job_executions_job_id
- idx_job_executions_executed_at
