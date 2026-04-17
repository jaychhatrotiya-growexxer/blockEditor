# BlockNote: Focused Document Workflows

BlockNote is a premium, browser-based block document editor designed for focus and productivity. Built with a modern tech stack, it provides a seamless writing experience with real-time saving, flexible block management, and easy document sharing.

## 🔗 Project Links

- **GitHub Repository**: [jaychhatrotiya-growexxer/blockEditor](https://github.com/jaychhatrotiya-growexxer/blockEditor)
- **Live Backend API**: [blockeditor-3.onrender.com](https://blockeditor-3.onrender.com)
- **Live Frontend App**: [block-editor-frontend.vercel.app](https://block-editor-frontend.vercel.app/)

## ✨ Features

- **Block-Based Editing**: Intuitive interface with various block types (Paragraph, Heading 1/2, Todo, Code, Divider, Image).
- **Drag-and-Drop**: Effortlessly reorder blocks with smooth drag-and-drop interactions.
- **Slash Commands**: Quickly insert new blocks using the responsive `/` menu.
- **Real-Time Auto-Save**: Your work is automatically saved as you type, ensuring no data loss.
- **Document Sharing**: Generate secure, read-only share links to collaborate or showcase your work.
- **PDF Export**: Single-click PDF generation with professional, print-friendly styling.
- **Auth & Sessions**: Secure JWT-based authentication with refresh token rotation.
- **Premium UI**: Modern minimalist interface with glassmorphism aesthetics and perfect vertical centering across all auth pages.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Modern Flexbox + Grid layout)
- **State Management**: React 19 Hooks & Context API
- **Drag & Drop**: @dnd-kit

### Backend
- **Core**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (Access + Refresh Rotation), Bcrypt for hashing
- **Validation**: Zod

## 🐳 Docker Support

The project is fully Dockerized, allowing you to generate images and spin up the entire stack seamlessly.

### Generating Images
You can generate Docker images for the backend and frontend using the provided Dockerfiles:

```bash
# Build all images defined in docker-compose
docker-compose build
```

### Running with Docker Compose
To spin up the entire application (PostgreSQL, Backend, and Frontend):

```bash
docker-compose up -d
```

- **PostgreSQL**: Runs on port `5432`
- **Backend API**: Runs on port `4000`
- **Frontend App**: Runs on port `3000`

## 🚀 Local Development (No Docker)

### Prerequisites
- Node.js (v20+)
- npm (v10+)
- A running PostgreSQL instance

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file in the root directory (refer to `.env.example`).
   - Create a `frontend/.env` file with `NEXT_PUBLIC_API_BASE_URL`.

3. **Initialize Database Schema**:
   ```bash
   npm run prisma:migrate --workspace backend
   ```

### Running the Application

- **Backend**: `npm run dev:backend` (runs on http://localhost:4000)
- **Frontend**: `npm run dev:frontend` (runs on http://localhost:3000)

## 🏗️ Architecture

The project follows a clean, modular architecture:
- **Frontend**: Organized by `features` (auth, documents, editor) with reusable `components` and `lib` for utility logic.
- **Backend**: Structured into modules following a `route -> controller -> service -> repository` pattern for clear separation of concerns.

## 🔒 Security

- All sensitive routes are protected by a JWT authorization middleware.
- Documents are private by default and owned by the creator.
- Share tokens are securely hashed in the database.
- Refresh token rotation prevents session hijacking.
