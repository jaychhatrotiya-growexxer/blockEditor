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

## 2026-04-14

**Tool:** Antigravity (Google DeepMind)

**What I asked for:**
1. Enhance block editors with a hover border effect and increase font/button sizes.
2. Add a beautifully styled floating action bar at the top with a pure frosted glass effect for block insertion.
3. Modify the Divider block so it only shows an option to "Delete" in its contextual menu, rendering it strictly uneditable.
4. Enhance the Image block so inputs cleanly hide when the image finishes loading, but can be recalled cleanly by clicking on the image.

**What it generated:**
- Added a `box-shadow` border effect on `.editor-block:hover`.
- Adjusted `.editor-canvas` padding and scaled up sizing inside `globals.css` for block typography and editor buttons.
- Implemented and styled a `.editor-floating-bar-wrapper` securely positioned under the main toolbar with refined `backdrop-filter` blur settings.
- Refactored `BlockMenu` in `block-menu.js` to conditionally hide the "Turn into" conversion section if `block.type === "divider"`, leaving only the Delete button.
- Updated `ImageBlock` in `image-block.js` with an `isEditing` state, cleverly hooking into image `onLoad`, block `onClick`, and `onBlur` for smooth un-intrusive editing.

**What I asked for:**
Redesign the block editor interface to look significantly more professional and premium, addressing existing UI/UX flaws such as the weird layout constraints and lack of hierarchical structure, without losing functionality.

**What it generated:**
- Identified that the block editor was erroneously trapped inside a user dashboard card layout wrapper for authentication (`protected-page.js`). Refactored authentication wrapper to accept `variant="editor"`, breaking out the editor into a responsive full-page structure.
- Completely refactored `EditorShell` (`editor-shell.js`) with a modern minimalist interface, adding a sticky Notion-style header block, a clear white document canvas (capped at 720px), internal back navigation, and inline document title editing that auto-saves alongside blocks.
- Rewrote `block-menu` to utilize the modern UX pattern of hovering left-side grips (six-dots), showing a dropdown layout handling conversion commands with active styling markers.
- Restyled the `slash-menu` into a sophisticated 3-column structured menu containing visual icons, a main label, and detailed text descriptions for blocks rather than simple emoji.
- Completed an extensive CSS overhaul in `globals.css`, introducing variables for interactive backdrop-filters (`blur()`), hover states, rounded geometry, pill-shaped save indicators, custom responsive media queries, and precise padding for different block typography levels.
