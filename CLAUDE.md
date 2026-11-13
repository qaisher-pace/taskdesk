# TaskDesk: project context and API specification

Paste this into Claude Code, or save it as `CLAUDE.md` in the repo root so it is read automatically.

## 1. Context

I am a backend-focused Node.js/Express engineer (4 years of JavaScript, 2 of them MEAN) learning React over 4 weeks (19 Oct to 15 Nov 2026) to work on enterprise projects and pass interviews. I am following a written plan (React 19.2, Vite, React Router, TanStack Query, React Hook Form + Zod, Vitest + React Testing Library, TypeScript from Week 3).

The learning is driven by one capstone app, **TaskDesk**: a support-ticket dashboard (login, roles, filterable and paginated list, detail page with comments, validated forms, optimistic updates, tests). The React front end is built in `web/` by me, with Claude in a separate chat. **Your job here is only the Express API in `api/`.**

### Rules for you (Claude Code)

- Work only inside `api/`. Do not scaffold, create or edit anything in `web/`.
- Plain JavaScript, ES modules (`"type": "module"`). No TypeScript in the API.
- Keep it small and readable. This is a learning backend, not a production system. No ORM, no database: in-memory data seeded at startup.
- Replace the current placeholder routes, which return only a generic success message, with the real logic below.
- Explain nothing at length; just write the code, then give me the run and test commands.

### Repo layout

```
taskdesk/
  api/    <- Express API (your job)
  web/    <- React app (not your job)
  README.md
  .gitignore
```

## 2. Technical requirements

- Express, `cors`, `jsonwebtoken`, `bcryptjs`, `zod` (validation). Config via env: run with `node --env-file=.env --watch src/server.js` (Node 20+).
- Port `4000`.
- CORS: allow origin `http://localhost:5173` (Vite), methods `GET, POST, PATCH, DELETE, OPTIONS`, headers `Content-Type, Authorization`.
- Suggested structure: `src/server.js`, `src/app.js`, `src/data/seed.js`, `src/routes/{auth,tickets,comments,users}.js`, `src/middleware/{auth,delay,errorHandler}.js`, `src/schemas.js`.
- `.env.example` (committed) and `.env` (git-ignored) with:
  - `PORT=4000`
  - `JWT_SECRET=change-me`
  - `REQUIRE_AUTH=false` (see Auth)
  - `SIMULATE_LATENCY=true`
  - `SIMULATE_ERRORS=true`

## 3. Data models

All ids are integers. Dates are ISO 8601 strings.

**User** `{ id, name, email, role, passwordHash }` where `role` is `"agent"` or `"admin"`. Never return `passwordHash`.

**Ticket**
```
{
  id, title, description,
  status:   "open" | "in_progress" | "resolved" | "closed",
  priority: "low" | "medium" | "high" | "urgent",
  assigneeId: number | null,
  reporterId: number,
  dueDate: string | null,
  createdAt, updatedAt
}
```

**Comment** `{ id, ticketId, authorId, authorName, text, createdAt }`

### Seed data (created at startup, held in memory, resets on restart)

- 5 users: 1 admin and 4 agents. Every password is `password123` (hash with bcryptjs at startup). Emails like `admin@taskdesk.test`, `asha@taskdesk.test`.
- 40 tickets with realistic support titles (login failures, billing questions, slow dashboard, export bugs, etc.), a mix of every status and priority, about 20% unassigned, some with a `dueDate` in the past (so the UI can show "overdue"), `createdAt` spread over the last 60 days.
- 2 to 5 comments on roughly half of the tickets.

## 4. Endpoints

### Auth

**`POST /auth/login`**: body `{ email, password }`.
- 200: `{ token, user: { id, name, email, role } }`. The JWT carries `sub` (user id) and `role`, signed HS256, expires in 1 hour.
- 400: validation error. 401: `{ message: "Invalid email or password" }` (same message for wrong email and wrong password).

**`GET /auth/me`**: returns `{ id, name, email, role }` for the token's user. 401 without a valid token.

### Tickets

**`GET /tickets`**: query parameters, all optional:
- `status`, `priority` (exact match; also accept comma-separated lists such as `status=open,in_progress`)
- `assigneeId` (number, or the literal `unassigned`)
- `q` (case-insensitive substring match on title or description)
- `page` (default 1), `limit` (default 10, max 50)
- `sort` (default `-createdAt`; allow `createdAt`, `-createdAt`, `priority`, `-priority`, `dueDate`, `-dueDate`; priority order is urgent > high > medium > low)

Response 200:
```json
{ "data": [ /* tickets */ ], "page": 1, "limit": 10, "total": 40, "totalPages": 4 }
```
Invalid query values return 400, not a silent fallback.

**`GET /tickets/:id`**: 200 with the ticket, or 404 `{ message: "Ticket not found" }`.

**`POST /tickets`**: body `{ title, description, priority, assigneeId?, dueDate? }`.
- Validation: `title` 3 to 120 characters, `description` 1 to 2000, `priority` in the enum, `assigneeId` must be an existing user or null, `dueDate` a valid date or null.
- Server sets `id`, `status: "open"`, `reporterId` (from the token, or `1` when auth is off), `createdAt`, `updatedAt`.
- 201 with the created ticket. 400 with field errors.

**`PATCH /tickets/:id`**: partial update of `title`, `description`, `status`, `priority`, `assigneeId`, `dueDate`. Unknown fields are rejected. Updates `updatedAt`. 200 with the updated ticket, 404, or 400.

**`DELETE /tickets/:id`**: admin only. 204 on success, 404 if missing. Also deletes that ticket's comments.

### Comments

**`GET /tickets/:id/comments`**: oldest first. 200 `[Comment]`, 404 if the ticket does not exist.

**`POST /tickets/:id/comments`**: body `{ text }` (1 to 1000 characters, trimmed). Author comes from the token (or user `1` when auth is off). 201 with the comment, 404, or 400.

### Users

**`GET /users`**: 200 `[{ id, name, role }]` (no email or hash). Used to fill assignee dropdowns.

## 5. Authentication and roles

Auth is introduced in the front end in Week 3, so it must be switchable:

- `REQUIRE_AUTH=false` (default for now): all routes except role-restricted ones work without a token; where a user is needed, use user `1` (the admin).
- `REQUIRE_AUTH=true`: every route except `POST /auth/login` needs `Authorization: Bearer <token>`. Missing or invalid token gives 401 `{ message: "Unauthorized" }`.
- Roles when auth is on:
  - `agent`: can read everything, create tickets, comment, and `PATCH` title, description, status, priority and dueDate.
  - `admin`: everything an agent can do, plus `DELETE /tickets/:id` and changing `assigneeId` on `PATCH`.
  - A forbidden action returns 403 `{ message: "Forbidden" }`. The API must enforce this itself because the UI hiding a button is not authorization.

## 6. Behaviours that make the React work realistic

- **Latency:** when `SIMULATE_LATENCY=true`, add a random 300 to 800 ms delay to every route except `/auth/login`.
- **Failures:** when `SIMULATE_ERRORS=true`, about 5% of `GET /tickets` and `PATCH /tickets/:id` requests return 500 `{ message: "Simulated server error" }`. Also support `?forceError=true` on any `GET` or `PATCH` to trigger a 500 on demand (needed for rollback and error-state practice).
- Both simulations default to on in `.env.example`, and must be turned off easily (for automated tests later).

## 7. Error format and status codes

Every error uses JSON: `{ "message": "...", "errors": [{ "field": "title", "message": "..." }] }` (`errors` only for validation). Use 400 for validation, 401 unauthenticated, 403 forbidden, 404 not found, 500 for unexpected errors via one central error handler. Never leak stack traces.

## 8. Acceptance checks (give me curl commands for these)

1. `GET /tickets?status=open&priority=high&q=login&page=2&limit=5` returns correct filtered, paginated results with accurate `total` and `totalPages`.
2. `POST /tickets` with an empty title returns 400 with a field error; with valid input returns 201 and the ticket then appears in `GET /tickets`.
3. `PATCH /tickets/:id` with `{ "status": "resolved" }` returns the updated ticket with a new `updatedAt`.
4. With `REQUIRE_AUTH=true`: no token gives 401; an agent token on `DELETE /tickets/:id` gives 403; an admin token gives 204.
5. Comments can be listed and added for a ticket; a missing ticket gives 404.
6. Responses arrive after the simulated delay, and `?forceError=true` returns a 500.
7. A request from `http://localhost:5173` passes CORS, including the `Authorization` header preflight.

## 9. Where I am in the plan

Setup is done. Week 1 starts with scaffolding `web/` and rendering a hard-coded ticket card, so the API only needs to be running with real data by Wednesday, when the front end first fetches from it. Do not wait on any React work.