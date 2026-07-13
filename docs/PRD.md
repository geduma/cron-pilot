# PRD - CronPilot

Product Requirements Document v1.0

---

## 1. Product Overview

**CronPilot** is a self-hosted web application for scheduling, executing, and monitoring HTTP jobs.

**Target users:** Developers and DevOps who need to keep services alive, monitor APIs, or automate HTTP tasks without configuring external cron jobs.

**Core value:** Simple, self-hosted alternative to cron jobs with a visual dashboard.

---

## 2. Goals & Objectives

### MVP Goals
- Allow users to create and manage HTTP jobs via a web interface
- Execute jobs on a scheduled frequency
- Provide execution history and error monitoring
- Enable manual job execution

### Success Metrics
- Users can create a job in under 2 minutes
- Jobs execute within 1 minute of scheduled time
- Dashboard loads in under 2 seconds

---

## 3. User Stories

### Authentication
- As a user, I want to log in with my GitHub account
- As a user, I want to stay logged in across sessions

### Job Management
- As a user, I want to create a new HTTP job with name, URL, method, and frequency
- As a user, I want to edit an existing job
- As a user, I want to delete a job
- As a user, I want to pause/resume a job

### Job Execution
- As a user, I want jobs to execute automatically on schedule
- As a user, I want to manually trigger a job execution
- As a user, I want to see if my job succeeded or failed

### Monitoring
- As a user, I want to see a dashboard with job statistics
- As a user, I want to view execution history for each job
- As a user, I want to filter history by time range (24h, 7d, 30d)

---

## 4. Features

### 4.1 Authentication
- OAuth login via Geduma Auth (GitHub provider)
- Session-based authentication
- Automatic logout on token expiration

### 4.2 Dashboard
- Active jobs count
- Paused jobs count
- Total executions
- Errors in last 24h
- Last execution time
- Next execution time
- Jobs table with quick actions

### 4.3 Job CRUD
- Create job with:
  - Name (required)
  - Description (optional)
  - HTTP Method: GET, POST, PUT, PATCH, DELETE
  - URL (required, valid)
  - Headers (JSON, optional)
  - Body (for POST/PUT/PATCH)
  - Expected status code (100-599)
  - Frequency (required)
  - Enabled/disabled toggle
- Edit job
- Delete job (with confirmation)
- Pause/resume job

### 4.4 Scheduler
- Runs every minute in the API process
- Executes jobs where `enabled=1 AND next_execution <= now()`
- 30-second timeout per job
- Saves execution result and updates next execution time

### 4.5 Execution History
- Table with: date, status, HTTP status, duration, error message
- Filters: All, Last 24h, Last 7 days, Last 30 days
- Pagination

### 4.6 Manual Execution
- "Run Now" button on each job
- Immediate execution
- Result saved to history

---

## 5. Technical Requirements

### 5.1 Frontend
- React 18 + TypeScript
- Vite build tool
- TailwindCSS (mobile-first)
- React Router v6
- TanStack React Query
- Axios for API calls

### 5.2 Backend
- Node.js + Fastify + TypeScript
- SQLite database (file-based, zero config)
- Auth via Geduma Auth (external)
- In-process scheduler

### 5.3 API
- RESTful endpoints
- JWT/Bearer token authentication
- Standard response format: `{ success, data, message }`
- Data isolation by user

### 5.4 Database
- SQLite via better-sqlite3
- File stored at `./data/cronpilot.db`
- Tables: `jobs`, `job_executions`
- Indexes on user_id, next_execution, job_id

---

## 6. Non-Functional Requirements

### 6.1 Performance
- API response time < 200ms
- Scheduler latency < 1 minute
- Frontend bundle < 200KB gzipped

### 6.2 Security
- All API endpoints require authentication
- Users can only access their own jobs
- No sensitive data in logs
- HTTPS in production

### 6.3 Scalability
- Single-server deployment
- SQLite for persistence (zero config)
- No external dependencies besides Geduma Auth

---

## 7. Out of Scope (MVP)

- Multiple organizations/teams
- Workflow automation
- Scripting/SQL jobs
- Redis/caching
- Distributed workers
- Cron expressions
- Webhooks/notifications
- Dark mode

---

## 8. Future Roadmap

### v1.1
- Global variables
- Job templates
- Duplicate job

### v1.2
- Webhooks
- Email notifications
- Discord notifications

### v2.0
- Cron expressions
- SQL jobs
- Custom scripts
- Redis integration
- Independent workers
- Advanced metrics

---

## 9. Design Guidelines

### Colors
- Green: Success/Active
- Red: Error/Failed
- Blue: Information
- Gray: Inactive/Paused

### UI Principles
- Clean, functional design
- Mobile-first responsive
- No dark mode in MVP
- Consistent spacing and typography

---

## 10. Open Questions

None - all requirements defined for MVP.
