"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { BlockRenderer } from "./blocks/block-renderer";
import { SlashMenu, getFilteredCommands, COMMANDS } from "./slash/slash-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
const DEFAULT_BLOCK_ORDER_GAP = 1024;
const DELETE_DROPZONE_ID = "editor-delete-dropzone";

function DeleteDropZone({ visible }) {
  const { isOver, setNodeRef } = useDroppable({
    id: DELETE_DROPZONE_ID,
  });

  return (
    <div
      className={`editor-delete-dropzone-wrapper${visible ? " editor-delete-dropzone-wrapper--visible" : ""}`}
      aria-hidden={!visible}
    >
      <div
        ref={setNodeRef}
        className={`editor-delete-dropzone${isOver ? " editor-delete-dropzone--active" : ""}`}
      >
        <span className="editor-delete-dropzone-icon">✕</span>
        <span className="editor-delete-dropzone-text">
          {isOver ? "Release to delete block" : "Drop here to delete"}
        </span>
      </div>
    </div>
  );
}

function InsertBlockControl({ onInsert }) {
  return (
    <div className="editor-insert-control">
      <button
        className="editor-insert-control-btn"
        type="button"
        onClick={onInsert}
        title="Add paragraph"
        aria-label="Add paragraph"
      >
        +
      </button>
    </div>
  );
}

function BulkSelectionBar({
  visible,
  allSelected,
  selectedCount,
  onSelectAll,
  onDelete,
  onCancel,
}) {
  return (
    <div
      className={`editor-bulk-bar-wrapper${visible ? " editor-bulk-bar-wrapper--visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="editor-bulk-bar">
        <span className="editor-bulk-bar-count">
          {selectedCount} {selectedCount === 1 ? "block" : "blocks"} selected
        </span>
        <button
          className="editor-bulk-bar-btn"
          type="button"
          onClick={onSelectAll}
          disabled={allSelected}
        >
          Select all
        </button>
        <button
          className="editor-bulk-bar-btn editor-bulk-bar-btn--danger"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
        <button
          className="editor-bulk-bar-btn editor-bulk-bar-btn--ghost"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankParagraphBlock() {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "paragraph",
    content: { text: "" },
    orderIndex: 0,
  };
}

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [createBlankParagraphBlock()];
  }

  return blocks
    .slice()
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((block, index) => ({
      ...block,
      orderIndex:
        typeof block.orderIndex === "number"
          ? block.orderIndex
          : index * DEFAULT_BLOCK_ORDER_GAP,
      content: block.content ?? {},
    }));
}

function assignOrderIndexes(blocks) {
  return blocks.map((block, index) => ({
    ...block,
    orderIndex: index * DEFAULT_BLOCK_ORDER_GAP,
  }));
}

export function EditorShell({ documentId }) {
  const { authorizedRequest, logout } = useAuth();
  const router = useRouter();
  const [blocks, setBlocks] = useState(() => [createBlankParagraphBlock()]);
  const [focusId, setFocusId] = useState(null);
  const [slashState, setSlashState] = useState(null);
  const [slashHighlight, setSlashHighlight] = useState(0);
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [docError, setDocError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [showBlockToolbar, setShowBlockToolbar] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const blockToolbarRef = useRef(null);
  const blockToolbarBtnRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = useCallback((args) => {
    const deleteZone = args.droppableContainers.filter(
      (container) => container.id === DELETE_DROPZONE_ID,
    );
    const deleteCollisions = rectIntersection({
      ...args,
      droppableContainers: deleteZone,
    });

    if (deleteCollisions.length > 0) {
      return deleteCollisions;
    }

    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => container.id !== DELETE_DROPZONE_ID,
      ),
    });
  }, []);

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function handleDragCancel() {
    setActiveDragId(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    setActiveDragId(null);

    if (over?.id === DELETE_DROPZONE_ID) {
      deleteBlock(active.id);
      return;
    }

    if (over && active.id !== over.id) {
      setBlocksAndMarkDirty((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return assignOrderIndexes(newItems);
      });
    }
  }

  function setBlocksAndMarkDirty(updater) {
    setBlocks((current) => {
      const nextBlocks = updater(current);
      return nextBlocks.length ? nextBlocks : [createBlankParagraphBlock()];
    });
  }

  function updateBlock(id, updater) {
    setBlocksAndMarkDirty((current) =>
      current.map((block) =>
        block.id === id ? { ...block, ...updater(block) } : block,
      ),
    );
  }

  function willLoseBlockData(block, nextType) {
    if (!block || block.type === nextType) {
      return false;
    }

    const text =
      typeof block.content?.text === "string" ? block.content.text : "";
    const url = typeof block.content?.url === "string" ? block.content.url : "";
    const hasText = text.trim().length > 0;
    const hasUrl = url.trim().length > 0;
    const hasChecked = block.type === "todo" && block.content?.checked;

    if (nextType === "divider" || nextType === "image") {
      return hasText || hasUrl || hasChecked;
    }

    if (nextType === "todo") {
      return hasUrl || hasChecked;
    }

    return hasUrl || hasChecked;
  }

  function confirmBlockTypeChange(blockId, nextType) {
    const block = blocks.find((item) => item.id === blockId);
    if (!willLoseBlockData(block, nextType)) {
      return true;
    }

    return window.confirm(
      "Changing the block type will remove this block's existing content. Continue?",
    );
  }

  function changeBlockType(blockId, type) {
    if (!confirmBlockTypeChange(blockId, type)) {
      return;
    }

    setBlocksAndMarkDirty((current) =>
      current.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        if (type === "divider") {
          return { ...block, type: "divider", content: {} };
        }

        if (type === "image") {
          return { ...block, type: "image", content: { url: "" } };
        }

        if (type === "todo") {
          return {
            ...block,
            type: "todo",
            content: { text: block.content?.text || "", checked: false },
          };
        }

        return { ...block, type, content: { text: block.content?.text || "" } };
      }),
    );
  }

  function deleteBlock(blockId) {
    setBlocksAndMarkDirty((current) => {
      const filtered = current.filter((block) => block.id !== blockId);
      return assignOrderIndexes(filtered);
    });
    setSelectedBlockIds((current) => current.filter((id) => id !== blockId));
  }

  function deleteSelectedBlocks() {
    if (selectedBlockIds.length === 0) return;

    const selected = new Set(selectedBlockIds);
    setBlocksAndMarkDirty((current) =>
      assignOrderIndexes(current.filter((block) => !selected.has(block.id))),
    );
    setSelectedBlockIds([]);
    closeSlashMenu();
  }

  function addBlock(type = "paragraph") {
    const newBlock = {
      id: generateId(),
      type,
      content:
        type === "divider"
          ? {}
          : type === "image"
            ? { url: "" }
            : type === "todo"
              ? { text: "", checked: false }
              : { text: "" },
      orderIndex: 0,
    };
    setBlocksAndMarkDirty((current) => {
      newBlock.orderIndex =
        (current[current.length - 1]?.orderIndex ?? 0) +
        DEFAULT_BLOCK_ORDER_GAP;
      return [...current, newBlock];
    });
    setFocusId(newBlock.id);
    setShowBlockToolbar(false);
  }

  function insertParagraphAt(index) {
    const newBlock = createBlankParagraphBlock();

    setBlocksAndMarkDirty((current) => {
      const nextBlocks = [...current];
      nextBlocks.splice(index, 0, newBlock);
      return assignOrderIndexes(nextBlocks);
    });

    closeSlashMenu();
    setFocusId(newBlock.id);
    setShowBlockToolbar(false);
  }

  function toggleBlockSelection(blockId, checked) {
    setSelectedBlockIds((current) => {
      if (checked) {
        return current.includes(blockId) ? current : [...current, blockId];
      }

      return current.filter((id) => id !== blockId);
    });
  }

  function selectAllBlocks() {
    setSelectedBlockIds(blocks.map((block) => block.id));
  }

  function clearBlockSelection() {
    setSelectedBlockIds([]);
  }

  function splitBlock(blockId, segments) {
    setBlocksAndMarkDirty((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index === -1) return current;

      const currentBlock = current[index];
      const beforeText = segments.before ?? "";
      const afterText = segments.after ?? "";

      const updatedBlock = {
        ...currentBlock,
        content: { ...currentBlock.content, text: beforeText },
      };

      const nextBlock = {
        id: generateId(),
        type: currentBlock.type,
        content:
          currentBlock.type === "todo"
            ? { text: afterText, checked: currentBlock.content?.checked ?? false }
            : currentBlock.type === "image"
              ? { url: "" }
              : { text: afterText },
        orderIndex: (currentBlock.orderIndex ?? 0) + DEFAULT_BLOCK_ORDER_GAP / 2,
      };

      const nextBlocks = [...current];
      nextBlocks.splice(index, 1, updatedBlock, nextBlock);
      setFocusId(nextBlock.id);
      return assignOrderIndexes(nextBlocks);
    });
  }

  function isTextBlock(block) {
    return ["paragraph", "heading_1", "heading_2", "todo", "code"].includes(block.type);
  }

  function handleBackspace(blockId) {
    setBlocksAndMarkDirty((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index <= 0) return current;

      const currentBlock = current[index];
      const previousBlock = current[index - 1];
      if (!isTextBlock(currentBlock)) return current;

      const currentText = currentBlock.content?.text || "";
      if (currentText.length > 0) return current;

      const nextBlocks = [...current];
      nextBlocks.splice(index, 1);
      setFocusId(previousBlock.id);
      return assignOrderIndexes(nextBlocks);
    });
  }

  const blockIndexMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((block, index) => map.set(block.id, index));
    return map;
  }, [blocks]);

  function openSlashMenu(blockId) {
    const element = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!element) return;

    const anchor = element.closest(".editor-block") || element;
    const rect = anchor.getBoundingClientRect();
    setSlashState({
      activeId: blockId,
      query: "",
      position: {
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      },
    });
    setSlashHighlight(0);
  }

  function closeSlashMenu() {
    setSlashState(null);
    setSlashHighlight(0);
  }

  function handleSlashKey(event, blockId) {
    if (!slashState || slashState.activeId !== blockId) {
      if (event.key === "/" && event.currentTarget.textContent === "") {
        openSlashMenu(blockId);
        return true;
      }
      return false;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSlashMenu();
      return true;
    }

    if (event.key === "Backspace") {
      if (slashState.query.length === 0) {
        event.preventDefault();
        closeSlashMenu();
        return true;
      }
      // Remove last character from query
      event.preventDefault();
      setSlashState((current) => {
        if (!current || current.activeId !== blockId) return current;
        return { ...current, query: current.query.slice(0, -1) };
      });
      // Reset highlight to 0 when query changes
      setSlashHighlight(0);
      return true;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const filtered = getFilteredCommands(slashState.query);
      setSlashHighlight((current) =>
        current < filtered.length - 1 ? current + 1 : 0,
      );
      return true;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const filtered = getFilteredCommands(slashState.query);
      setSlashHighlight((current) =>
        current > 0 ? current - 1 : filtered.length - 1,
      );
      return true;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const filtered = getFilteredCommands(slashState.query);
      if (filtered.length > 0) {
        const selectedType = filtered[slashHighlight]?.type || filtered[0].type;
        applySlashSelection(blockId, selectedType);
      }
      return true;
    }

    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const nextQuery = `${slashState.query}${event.key}`;
      setSlashState((current) => {
        if (!current || current.activeId !== blockId) return current;
        return { ...current, query: nextQuery };
      });
      setSlashHighlight(0);
      return true;
    }

    return false;
  }

  function applySlashSelection(blockId, type) {
    if (!confirmBlockTypeChange(blockId, type)) return;

    setBlocksAndMarkDirty((current) =>
      current.map((block) => {
        if (block.id !== blockId) return block;
        if (type === "divider") return { ...block, type: "divider", content: {} };
        if (type === "image") return { ...block, type: "image", content: { url: "" } };
        if (type === "todo") return { ...block, type: "todo", content: { text: "", checked: false } };
        return { ...block, type, content: { text: "" } };
      }),
    );

    closeSlashMenu();
    setFocusId(blockId);
  }

  // Close block toolbar when clicking outside
  useEffect(() => {
    if (!showBlockToolbar) return;

    function handleClickOutside(event) {
      if (
        blockToolbarRef.current &&
        !blockToolbarRef.current.contains(event.target) &&
        blockToolbarBtnRef.current &&
        !blockToolbarBtnRef.current.contains(event.target)
      ) {
        setShowBlockToolbar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBlockToolbar]);

  async function saveDocument() {
    if (!documentId) return;
    setSaveState("saving");

    try {
      await authorizedRequest(`/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: documentTitle,
          blocks: assignOrderIndexes(blocks),
        }),
      });
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      console.error(error);
    }
  }

  useEffect(() => {
    if (!documentId) { setIsLoadingDoc(false); return; }

    let cancelled = false;

    async function loadDocument() {
      setIsLoadingDoc(true);
      setDocError("");

      try {
        const result = await authorizedRequest(`/documents/${documentId}`);
        if (!cancelled) {
          const loadedBlocks = normalizeBlocks(result.document?.blocks || []);
          setBlocks(loadedBlocks);
          setDocumentTitle(result.document?.title || "Untitled document");
          setDocumentLoaded(true);
          setSaveState("saved");
        }
      } catch (error) {
        if (!cancelled) setDocError(error.message || "Unable to load document.");
      } finally {
        if (!cancelled) setIsLoadingDoc(false);
      }
    }

    loadDocument();
    return () => { cancelled = true; };
  }, [authorizedRequest, documentId]);

  useEffect(() => {
    if (!documentLoaded || isLoadingDoc) return;

    setSaveState("dirty");
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => { saveDocument(); }, 800);
    return () => { window.clearTimeout(saveTimeoutRef.current); };
  }, [blocks, documentTitle, documentLoaded, isLoadingDoc]);

  useEffect(() => {
    setSelectedBlockIds((current) =>
      current.filter((id) => blocks.some((block) => block.id === id)),
    );
  }, [blocks]);

  useEffect(() => {
    if (!focusId) return;
    const element = document.querySelector(`[data-block-id="${focusId}"]`);
    if (element) {
      element.focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setFocusId(null);
  }, [focusId, blocks]);

  const saveLabel =
    saveState === "saving" ? "Saving…"
      : saveState === "saved" ? "Saved"
        : saveState === "error" ? "Save failed"
          : "Unsaved";

  const saveClass =
    saveState === "saved" ? "save-pill save-pill--saved"
      : saveState === "error" ? "save-pill save-pill--error"
        : saveState === "saving" ? "save-pill save-pill--saving"
          : "save-pill";
  const selectedCount = selectedBlockIds.length;
  const isSelectionMode = selectedCount > 0;
  const allBlocksSelected = blocks.length > 0 && selectedCount === blocks.length;

  return (
    <div className="editor-layout">
      {/* ── Sticky Top Bar ── */}
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button
            className="editor-back-btn"
            type="button"
            title="Back to documents"
            onClick={() => router.push("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="editor-topbar-title-group">
            <input
              className="editor-topbar-title"
              value={isLoadingDoc ? "Loading…" : documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Untitled document"
            />
          </div>
        </div>

        <div className="editor-topbar-right">
          <span className={saveClass}>{saveLabel}</span>

          {/* ── Floating Block Toolbar ── */}
          <div className="editor-block-toolbar-wrapper">
            <button
              ref={blockToolbarBtnRef}
              className="editor-topbar-btn"
              type="button"
              onClick={() => setShowBlockToolbar((v) => !v)}
              title="Add block"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add block
            </button>

            {showBlockToolbar && (
              <div className="editor-block-toolbar" ref={blockToolbarRef}>
                <div className="editor-block-toolbar-header">Insert a block</div>
                {COMMANDS.map((cmd) => (
                  <button
                    key={cmd.type}
                    className="editor-block-toolbar-item"
                    type="button"
                    onClick={() => addBlock(cmd.type)}
                  >
                    <span className="editor-block-toolbar-icon">{cmd.icon}</span>
                    <span className="editor-block-toolbar-text">
                      <span className="editor-block-toolbar-label">{cmd.label}</span>
                      <span className="editor-block-toolbar-desc">{cmd.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="editor-topbar-btn editor-topbar-btn--primary"
            type="button"
            disabled={saveState === "saving"}
            onClick={saveDocument}
          >
            Save
          </button>
          <button
            className="editor-topbar-btn editor-topbar-btn--ghost"
            type="button"
            onClick={logout}
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.33C2.97 14 2.62 13.86 2.37 13.61C2.12 13.36 2 13.01 2 12.65V3.35C2 2.99 2.12 2.64 2.37 2.39C2.62 2.14 2.97 2 3.33 2H6M11 11.33L14 8L11 4.67M14 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {docError ? <div className="editor-error-banner">{docError}</div> : null}

      {/* ── Canvas ── */}
      <main className="editor-canvas">
        <div className="editor-page-content">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="editor-blocks">
                <InsertBlockControl onInsert={() => insertParagraphAt(0)} />
                {blocks.map((block, index) => (
                  <div className="editor-block-stack" key={block.id}>
                    <BlockRenderer
                      block={block}
                      isSelected={selectedBlockIds.includes(block.id)}
                      showSelectionControls={isSelectionMode}
                      onSelectChange={toggleBlockSelection}
                      onChange={(nextContent) =>
                        updateBlock(block.id, () => ({
                          content: { ...block.content, ...nextContent },
                        }))
                      }
                      onToggle={(checked) =>
                        updateBlock(block.id, () => ({
                          content: { ...block.content, checked },
                        }))
                      }
                      onSplit={(segments) => splitBlock(block.id, segments)}
                      onBackspace={() => handleBackspace(block.id)}
                      onSlash={(event) => handleSlashKey(event, block.id)}
                      onChangeType={changeBlockType}
                      onDelete={deleteBlock}
                    />
                    <InsertBlockControl onInsert={() => insertParagraphAt(index + 1)} />
                  </div>
                ))}
              </div>
            </SortableContext>
            <DeleteDropZone visible={Boolean(activeDragId)} />
          </DndContext>

          {/* Click to add block area */}
          <div
            className="editor-click-to-add"
            onClick={() => addBlock()}
            role="button"
            tabIndex={0}
          />
        </div>
      </main>

      <SlashMenu
        activeId={slashState?.activeId}
        query={slashState?.query || ""}
        position={slashState?.position || { top: 0, left: 0 }}
        highlightedIndex={slashHighlight}
        onSelect={(type) => {
          if (slashState?.activeId) {
            applySlashSelection(slashState.activeId, type);
          }
        }}
      />

      <BulkSelectionBar
        visible={isSelectionMode && !activeDragId}
        allSelected={allBlocksSelected}
        selectedCount={selectedCount}
        onSelectAll={selectAllBlocks}
        onDelete={deleteSelectedBlocks}
        onCancel={clearBlockSelection}
      />

      {/* ── Floating Action Bar ── */}
      <div className="editor-floating-bar-wrapper">
        <div className="editor-floating-bar">
          {COMMANDS.map((cmd) => (
            <button
              key={cmd.type}
              className="editor-floating-bar-btn"
              type="button"
              onClick={() => addBlock(cmd.type)}
              title={cmd.desc}
            >
              <span className="editor-floating-bar-icon">{cmd.icon}</span>
              <span>{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
