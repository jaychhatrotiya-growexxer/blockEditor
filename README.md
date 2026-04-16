# BlockNote: Focused Document Workflows

BlockNote is a premium, browser-based block document editor designed for focus and productivity. Built with a modern tech stack, it provides a seamless writing experience with real-time saving, flexible block management, and easy document sharing.

## ✨ Features

- **Block-Based Editing**: Intuitive interface with various block types (Paragraph, Heading 1/2, Todo, Code, Divider, Image).
- **Drag-and-Drop**: Effortlessly reorder blocks with smooth drag-and-drop interactions.
- **Slash Commands**: Quickly insert new blocks using the responsive `/` menu.
- **Real-Time Auto-Save**: Your work is automatically saved as you type, ensuring no data loss.
- **Document Sharing**: Generate secure, read-only share links to collaborate or showcase your work.
- **PDF Export**: Single-click PDF generation with professional, print-friendly styling.
- **Auth & Sessions**: Secure JWT-based authentication with refresh token rotation.
- **Forbidden Access Handling**: Beautiful, stateful "Access Denied" page for unauthorized document access.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (Global & Scoped)
- **State Management**: React Hooks & Context API
- **Drag & Drop**: @dnd-kit

### Backend
- **Core**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (Access + Refresh Rotation), Bcrypt for hashing
- **Validation**: Zod

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL database)

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file in the root directory (refer to `.env.example`).
   - Create a `frontend/.env` file with `NEXT_PUBLIC_API_BASE_URL`.

3. **Spin up the Database**:
   ```bash
   docker compose up -d
   ```

4. **Initialize Database Schema**:
   ```bash
   npm run prisma:migrate --workspace backend
   ```

### Running the Application

- **Backend**: `npm run dev:backend` (runs on http://localhost:4000)
- **Frontend**: `npm run dev:frontend` (runs on http://localhost:3000)

## 🏗️ Architecture

The project follows a clean, modular architecture:
- **Frontend**: Organized by `features` (auth, documents, editor) with reusable `components` and `lib` for utility logic.
- **Backend**: Structured into modules (`auth`, `documents`) following a `route -> controller -> service -> repository` pattern for clear separation of concerns.

## 🔒 Security

- All sensitive routes are protected by a JWT authorization middleware.
- Documents are private by default and owned by the creator.
- Share tokens are securely hashed in the database.
- Refresh token rotation prevents session hijacking.
