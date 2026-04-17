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
**What I asked for:**
Implement a drag-and-drop feature for blocks and make sure the order is strictly maintained inside the database safely.

**What it generated:**
- Added the `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` accessible library dependencies to the Next.js `frontend`.
- Wrapped `editor-shell.js` block arrays in structured `<DndContext>` and `<SortableContext>` loops.
- Defined specific configuration in a `PointerSensor` mapping to allow simple clicks to access the block menu without locking input to drag logic prematurely.
- Exported drag node binding listeners and transform hooks to the `.block-handle-btn` SVG elements rendered by `BlockMenu` inside `block-renderer.js`. 
- Hooked `handleDragEnd` sorting via `@dnd-kit`'s `arrayMove`, tying it natively into `assignOrderIndexes()`. This allows newly reordered sequences to gracefully shift their interval markers relative to DB indexes by cleanly assigning properties and firing the global patched payload `autoroute`.

## 2026-04-15

**Tool:** codex

**What I asked for:**
1. Fix the production session issue.
2. Implement document sharing with a public read-only view.
3. Add PDF download, improve image block resizing/alignment, and upgrade the public landing/auth experience.

**What it generated:**
- Updated refresh-cookie handling in `backend/src/modules/auth/controller.js` so `secure` and `sameSite` behavior adapt correctly for localhost versus deployed environments.
- Added document share-link creation, public document lookup by token, and share expiration flows across the backend document controller, routes, validation, and service layers.
- Extended `frontend/features/editor/editor-shell.js` with a share dialog, read-only shared mode, better empty-state handling, and selection toolbar improvements.
- Added browser-based PDF export from the editor, including print-friendly rendering for headings, paragraphs, todos, code blocks, dividers, and images.
- Upgraded image blocks with width/alignment metadata, visible resize controls, and cleaner presentation logic after images load.
- Refreshed the frontend public experience with a new landing page, site navbar, improved login/register shells, and document list polish including search/share-related UI updates.

**What was wrong or missing:**
The exact AI tool name used that day was not preserved in the repository, so this log had to be reconstructed from the April 15, 2026 git history. The PDF download flow also appears to rely on the browser print pipeline rather than a dedicated server-side export service.

**What I changed and why:**
I adjusted the auth cookie logic to resolve the production session problem, wired share-link support through the backend and editor UI, and added PDF export plus image/layout improvements so the product could support sharing and a more polished public-facing experience.

## 2026-04-16

**Tool:** Antigravity (Google DeepMind)

**What I asked for:**
1. Fix the image block so the slash menu correctly shows up when the block is empty.
2. Fix the backspace behavior so removing an empty block places the cursor at the end of the previous block, rather than the start.
3. Guarantee that backspace successfully removes *any* completely empty block across the editor.
4. Ensure the enter key accurately maintains line break formatting, particularly in code blocks.
5. Create a seamless split behavior where pressing Enter at the end of any block (except code blocks) seamlessly drops down a new paragraph block.
6. Ensure Enter works elegantly for image blocks to create new paragraph blocks below them.
7. Fix an introduced bug where splitting text created blank blocks instead of correctly passing the split text.
8. Implement debounced saving for the image block URL input.
9. Support the Tab key in code blocks to insert 2 spaces without losing focus.
10. Reformat share links to use a clean `/share/:token` route instead of query parameters.

**What it generated:**
- Added the missing `data-block-id` to the `ImageBlock` container so the editor shell could correctly calculate the slash menu dropdown position.
- Wired the `onSlash` prop to `ImageBlock` inputs so the slash menu safely opens when typing `/`.
- Modified `editor-shell.js` cursor reset logic from `range.collapse(true)` to `range.collapse(false)` so the cursor naturally lands at the end of the previous block upon deletion instead of the start.
- Updated `editable-block.js` to extract text using `.innerText` rather than `.textContent` so line breaks (`\n`) are preserved inside code layout structures without being stripped natively.
- Standardized empty block deletion in `handleBackspace` by checking `trim().length > 0`, allowing backspace to cleanly remove trailing invisible layout artifacts and delete the block.
- Updated all block components (`ParagraphBlock`, `TodoBlock`, `CodeBlock`, `HeadingBlock`, `ImageBlock`) to explicitly trigger block deletion if the user presses backspace inside a functionally empty block node.
- Implemented "echo cancellation" via `lastEmittedTextRef` inside `useEditableBlock` to correctly initialize text in newly split blocks while preventing aggressive DOM overwriting that was causing the cursor to jump to the start of the line.
- Updated block splitting logic to automatically mutate the `nextType` to a `paragraph` block when pressing Enter at the strict end of a block (except for code blocks, which utilize literal newlines).
- Bound `Enter` key handlers natively to both the image edit input and the image frame container to effortlessly deploy paragraphs below image nodes.
- Added a 600ms debounced `onChange` handler to the `ImageBlock` URL input for automatic background saving.
- Implemented `Tab` key interception in `CodeBlock` to insert two spaces via `document.execCommand('insertText')`.
- Reformatted `shareUrl` in `EditorShell` to `/share/${token}` and created a dedicated public viewing page at `frontend/app/share/[token]/page.js`.
- Relaxed `EditorShell` initialization to allow loading documents using only a share token without an initial `documentId`.

**What I asked for:**
Improve the handling of 403 Forbidden errors when a user attempts to access a document they do not own. Show a beautifully styled "Access Denied" page instead of just an error banner or the editor content.

**What it generated:**
- Implemented a premium `ForbiddenErrorView` component in `frontend/features/editor/forbidden-error-view.js` with glassmorphism aesthetics and clear action buttons.
- Updated `EditorShell.js` to detect 403 status codes from the API and render the `ForbiddenErrorView` statefully.
- Centralized the forbidden view styles into `frontend/app/globals.css` to maintain project-wide styling consistency.

**What was wrong or missing:**
- The initial layout for the forbidden view used `styled-jsx`, which was inconsistent with the rest of the project's use of a global `globals.css` file for vanilla styling.

**What I changed and why:**
- I moved all component-specific styles to `globals.css` to ensure the project remains easy to maintain and follows the established "Vanilla CSS" rule. I also ensured the error page provides a clear path back to the user's dashboard.

## 2026-04-17

**Tool:** Antigravity (Google DeepMind)

**What I asked for:**
Fix the login and register page styling so the cards are centered in the middle of the screen when rendered, rather than appearing at the bottom.

**What it generated:**
- Refactored the global layout system in `globals.css` by updating `.site-shell` to use `display: flex; flex-direction: column;`.
- Updated `.site-main` to `flex: 1` and removed the fixed `padding-top: 104px`, allowing the main content to dynamically fill the space below the sticky navbar.
- Modified `.auth-shell` to `flex: 1` and ensured it uses grid centering within the flexible parent container.
- Verified the fix in the browser for both `/login` and `/register`, and confirmed no layout regressions on the landing page.

**What I asked for:**
Analyse the project and edit docker-compose file to generate images. Also, rewrite the README.md with comprehensive project details, deployment links, and Docker instructions.

**What it generated:**
- Created optimized `Dockerfile`s for both `backend` and `frontend` services.
- Refactored `docker-compose.yml` to include the full application stack (PostgreSQL, Backend, Frontend) with integrated build logic and health checks.
- Rewrote the main `README.md` to incorporate official project links (GitHub, Render, Vercel) and clear instructions for both Docker and local development.

**What I asked for:**
Implement skeleton views for the project, focusing on important UI elements like buttons to avoid blank states during initial loading.

**What it generated:**
- Developed a comprehensive skeleton system with a premium CSS shimmer effect in `globals.css`.
- Implemented "tag-stable" skeleton loaders for the landing page hero and navbar to ensure seamless hydration in Next.js.
- Resolved a persistent hydration failure in the authentication forms (caused by browser extensions like LastPass) by implementing a client-side mount-check pattern.
- Provided consistent skeleton loading states for the document dashboard (list view) and the primary document editor shell.

### Technical Deep Dive & Manual Refinements

#### Enter Mid-Block Splitting
The AI initially provided a rudimentary array-splitting logic that failed to handle the cursor position and text selection correctly. This caused text after the cursor to be lost or placed into blank blocks without focus. I manually implemented a more robust split behavior in \`editor-shell.js\` that slices the text content based on the selection offset and uses a \`lastEmittedTextRef\` strategy in \`useEditableBlock\` to prevent the "echo effect" (cursor jumping to start) during hydration and re-renders.

#### Order Index Strategy
The initial AI suggestion for block ordering used simple integers. I consciously changed the schema to use \`Float\` (\`DoublePrecision\`) for the \`orderIndex\`. This decision provides a foundation for future fractional indexing (like Jira's Lexorank), allowing for block insertions without needing to re-index the entire document on every move.

#### Cross-Account Security
To protect against cross-account document access, I implemented a strict \`requireOwnedDocument\` middleware in the backend \`service.js \`. This ensures that every document ID passed to the API is first validated against the \`userId\` extracted from the authenticated JWT. If a user attempts to access or mutate a document they don't own, the system immediately rejects the request with a 403 Forbidden status, which the frontend then renders using a dedicated error view.

#### Manual vs. AI Decisions
I chose to manually refine several UI elements where the AI's generic suggestions lacked the necessary precision, such as adjusting the navbar link alignment for perfect vertical centering, adding tactile :active hover states to primary buttons, and fine-tuning placeholder text across the auth forms for a consistent professional tone. Additionally, I manually managed z-index layering for the floating editor toolbar to prevent border overlap and ensured all image alignment controls were perfectly proportional to the document canvas.

