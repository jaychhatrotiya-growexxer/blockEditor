# BlockNote Intern Practical

Browser-based block document editor built with Next.js, Express, PostgreSQL, and Prisma.

## Setup (Local)

1. Install dependencies:
   - `npm install`
2. Ensure your environment files are present:
   - Root env: `.env`
   - Frontend env: `frontend/.env`
3. Start PostgreSQL (Docker):
   - `docker compose up -d`
4. Run Prisma migrations:
   - `npm run prisma:migrate --workspace backend`
5. Start the apps:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`

## Environment Variables

Reference `.env.example` for the full list.

Backend (root `.env`):
- `PORT`: Express server port
- `CLIENT_URL`: Frontend origin used by CORS
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Secret for access JWTs
- `JWT_REFRESH_SECRET`: Secret for refresh JWTs
- `ACCESS_TOKEN_EXPIRES_IN`: Access token TTL, e.g. `15m`
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token TTL, e.g. `7d`
- `REFRESH_COOKIE_NAME`: Cookie name for refresh token
- `SHARE_TOKEN_SECRET`: Secret used for share token hashing
- `BCRYPT_SALT_ROUNDS`: Cost factor for password hashing

Frontend (`frontend/.env`):
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend, e.g. `http://localhost:4000/api/v1`

## Architecture Decisions

- Next.js (App Router) for the frontend, plain JavaScript only
- Express.js REST API with centralized error handling
- PostgreSQL + Prisma ORM with parameterized queries
- JWT auth with refresh-token rotation stored in DB
- Clean module boundaries: `route -> controller -> service -> repository`

## Known Issues

- Local DB setup requires Docker; if Docker is not installed, migrations cannot be applied locally.
- Block editor functionality is not yet implemented (Day 2–3 scope).

## Edge Case Decisions

- Enter mid-block split: must preserve all text and move cursor to the new block (planned for Day 2–3).
- Backspace at start of first block: no-op to avoid deleting the only block (planned for Day 2–3).
- Backspace when previous block is non-text: focus moves to the previous block wrapper (planned for Day 2–3).
- Slash menu text bleed: slash input never persists to block content (planned for Day 2–3).
- `order_index` is FLOAT and renormalized when gaps < `0.001` (planned for Day 4).
- Auto-save race condition: queued/aborted saves to prevent stale overwrite (planned for Day 4).
- Cross-account access: protected by user ownership checks, returns 403 (implemented).

## Repository Checklist

- `.env.example` present
- Prisma schema uses FLOAT for `order_index`
- Auth and document APIs are protected with JWT
- Share APIs and editor modules to be implemented in later phases
