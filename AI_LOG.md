# AI Log

## 2026-04-13

**Tool:** ChatGPT (Codex)

**What I asked for:**
System architecture, Phase 1 setup, backend auth/document APIs, and frontend auth + dashboard scaffolding.

**What it generated:**
Monorepo scaffolding, Prisma schema + migrations, Express app shell, JWT auth with refresh rotation, document list API, and frontend auth pages with protected dashboard.

**What was wrong or missing:**
Local Docker wasn’t available in the environment, so migrations couldn’t be applied to a running database. Also, I needed a separate `frontend/.env` because Next.js could not read the repo-root `.env` for `NEXT_PUBLIC_API_BASE_URL` in my setup.

**What I changed and why:**
I created `frontend/.env` to ensure the frontend could read `NEXT_PUBLIC_API_BASE_URL` during local development. I also documented that Docker is required for applying migrations locally.
