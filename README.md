# BlockNote: Focused Document Workflows

BlockNote is a premium, browser-based block document editor designed for focus and productivity. Built with a modern tech stack, it provides a seamless writing experience with real-time saving, flexible block management, and easy document sharing.

## 🔗 Project Links

- **GitHub Repository**: [jaychhatrotiya-growexxer/blockEditor](https://github.com/jaychhatrotiya-growexxer/blockEditor)
- **Live Backend API**: [blockeditor-3.onrender.com](https://blockeditor-3.onrender.com)
- **Live Frontend App**: [block-editor-frontend.vercel.app](https://block-editor-frontend.vercel.app/)

## 🚀 Setup & Installation

### Option 1: Docker Compose (Recommended)
The easiest way to run the entire stack (Database, Backend, Frontend) is using Docker Compose.

1. **Clone the repo and ensure Docker is running.**
2. **Build and start the containers**:
   ```bash
   docker-compose up --build -d
   ```
3. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:4000/api/v1`

### Option 2: Local Development
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Copy `.env.example` to the root directory as `.env` and fill in the values.
3. **Initialize the Database**:
   ```bash
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   ```
4. **Run the services**:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`

## ⚙️ Environment Variables

The project uses a unified environment configuration. Refer to `.env.example` for reference:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Explicit API endpoint for the frontend client. |
| `PORT` | The local port for the Express backend (default 4000). |
| `CLIENT_URL` | The frontend origin, used for CORS and redirect security. |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `JWT_ACCESS_SECRET` | Strong secret for short-lived (15m) access tokens. |
| `JWT_REFRESH_SECRET` | Secret for long-lived (7d) refresh token rotation. |
| `ACCESS_TOKEN_EXPIRES_IN` | Standard lifespan for session interaction. |
| `REFRESH_TOKEN_EXPIRES_IN` | Standard lifespan for persistent sessions. |
| `REFRESH_COOKIE_NAME` | Name of the HTTP-only cookie storing the refresh token. |
| `SHARE_TOKEN_SECRET` | Secret for generating unguessable document share URLs. |
| `BCRYPT_SALT_ROUNDS` | Security factor for password hashing (recommended 12). |

## 🏗️ Architecture Decisions

- **Block-Based Storage**: Unlike traditional editors that save a single HTML blob, BlockNote stores documents as a sequence of unique block entities. This allows for seamless drag-and-drop reordering, granular updates, and better support for future block types like interactive tables or embeds.
- **Next.js 15 App Router**: Chosen for its robust server-side rendering (SSR) capabilities which ensure that the public landing page and shared document views are highly SEO-friendly and performant.
- **JWT Refresh Token Rotation**: To ensure enterprise-grade security, we implemented token rotation. Every time a refresh token is used to get a new access token, a new refresh token is also issued, making hijacked tokens useless after a single rotation.
- **Prisma ORM**: Provides a type-safe bridge to PostgreSQL, ensuring that schema changes are always synchronized between the database and the application logic.

## ⚠️ Known Issues

- **URL-Only Images**: The current version supports embedding images via URL only. Native file uploading is currently in the experimental stage.
- **Single-User Editing**: While document sharing is supported, simultaneous real-time multi-user editing (like Google Docs) is not yet implemented.
- **Search Indexing**: Search currently uses basic SQL ILIKE matching; for very large document sets, full-text search indexing (e.g., pg_trgm) might be required.

## 🧭 Edge Case Decisions

- **Deleted Document Share Links**: If a document is deleted, all existing share links immediately return a 404 to ensure user privacy and data removal.
- **Unauthorized Share Editing**: If a guest tries to access protected editor routes via a share link, the application automatically strips editing privileges and forces a read-only view.
- **Refresh Token Expiry**: When a refresh token expires, the user is gracefully redirected to the login page with a "Session Expired" notification rather than a broken page state.
- **Empty Document States**: New documents are initialized with a single empty paragraph block rather than a null state to provide an immediate "type here" experience.
- **Mobile Responsiveness**: The editor uses a flexible grid layout that prioritizes content readability on small screens by collapsing side toolbars into overlay menus.

---
Built with focus by **BlockNote Team**.
