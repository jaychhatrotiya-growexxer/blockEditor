"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import { ForbiddenErrorView } from "./forbidden-error-view";
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
const INITIAL_PLACEHOLDER_BLOCK_ID = "editor-initial-placeholder";

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
  onToggleSelectAll,
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
          onClick={onToggleSelectAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
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

function ShareDialog({
  open,
  shareUrl,
  isShared,
  busy,
  message,
  error,
  onEnable,
  onCopy,
  onExpire,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="editor-share-popover" role="dialog" aria-label="Share document">
      <div className="editor-share-popover-header">
        <div>
          <div className="editor-share-popover-title">Share link</div>
          <p className="editor-share-popover-subtitle">
            Anyone with this link can open the document in read-only mode.
          </p>
        </div>
        <button
          className="editor-share-close"
          type="button"
          onClick={onClose}
          aria-label="Close share dialog"
        >
          ×
        </button>
      </div>

      <div className="editor-share-popover-body">
        <input
          className="editor-share-input"
          type="text"
          value={shareUrl}
          readOnly
          placeholder="Generate a share link to copy it"
        />

        <div className="editor-share-actions">
          <button
            className="editor-topbar-btn editor-topbar-btn--primary"
            type="button"
            onClick={isShared ? onCopy : onEnable}
            disabled={busy}
          >
            {busy ? "Working..." : isShared ? "Copy link" : "Create link"}
          </button>

          <button
            className="editor-topbar-btn"
            type="button"
            onClick={onExpire}
            disabled={busy || !isShared}
          >
            Expire link
          </button>
        </div>

        {message ? <p className="editor-share-feedback">{message}</p> : null}
        {error ? <p className="editor-share-feedback editor-share-feedback--error">{error}</p> : null}
      </div>
    </div>
  );
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankParagraphBlock(id = generateId()) {
  return {
    id,
    type: "paragraph",
    content: { text: "" },
    orderIndex: 0,
  };
}

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [];
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

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFileName(value) {
  return (value || "document")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 80) || "document";
}

function clampImageWidth(value) {
  const width = Number(value);

  if (Number.isNaN(width)) {
    return 50;
  }

  return Math.min(100, Math.max(20, Math.round(width)));
}

function normalizeImageAlign(value) {
  return ["left", "center", "right"].includes(value) ? value : "center";
}

function formatPrintText(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function renderPrintBlock(block) {
  const text = typeof block.content?.text === "string" ? block.content.text : "";
  const url = typeof block.content?.url === "string" ? block.content.url.trim() : "";

  if (block.type === "heading_1") {
    return `<h1 class="pdf-heading-1">${formatPrintText(text || "Untitled heading")}</h1>`;
  }

  if (block.type === "heading_2") {
    return `<h2 class="pdf-heading-2">${formatPrintText(text || "Section heading")}</h2>`;
  }

  if (block.type === "todo") {
    return `
      <div class="pdf-todo">
        <span class="pdf-todo-box${block.content?.checked ? " pdf-todo-box--checked" : ""}">
          ${block.content?.checked ? "&#10003;" : ""}
        </span>
        <div class="pdf-todo-text">${formatPrintText(text)}</div>
      </div>
    `;
  }

  if (block.type === "code") {
    return `<pre class="pdf-code">${escapeHtml(text)}</pre>`;
  }

  if (block.type === "divider") {
    return `<hr class="pdf-divider" />`;
  }

  if (block.type === "image") {
    if (!url) {
      return `<div class="pdf-image-placeholder">Image block</div>`;
    }

    return `
      <figure
        class="pdf-image-wrap"
        style="
          width:${clampImageWidth(block.content?.width)}%;
          margin-left:${normalizeImageAlign(block.content?.align) === "right" ? "auto" : "0"};
          margin-right:${normalizeImageAlign(block.content?.align) === "left" ? "auto" : "0"};
        "
      >
        <img class="pdf-image" src="${escapeHtml(url)}" alt="" />
      </figure>
    `;
  }

  return `<p class="pdf-paragraph">${formatPrintText(text)}</p>`;
}

function buildPrintHtml(title, blocks) {
  const content =
    Array.isArray(blocks) && blocks.length > 0
      ? blocks.map((block) => renderPrintBlock(block)).join("")
      : `<p class="pdf-empty">This document is empty.</p>`;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(sanitizeFileName(title))}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 16mm 20mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1f2937;
            font-family: Inter, "Segoe UI", Arial, sans-serif;
          }

          body {
            padding: 0;
          }

          .pdf-document {
            width: 100%;
          }

          .pdf-title {
            margin: 0 0 20px;
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: -0.04em;
            color: #111827;
          }

          .pdf-meta {
            margin: 0 0 28px;
            font-size: 12px;
            color: #6b7280;
          }

          .pdf-heading-1,
          .pdf-heading-2,
          .pdf-paragraph,
          .pdf-code,
          .pdf-todo,
          .pdf-image-wrap,
          .pdf-image-placeholder,
          .pdf-divider,
          .pdf-empty {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .pdf-heading-1 {
            margin: 28px 0 10px;
            font-size: 24px;
            line-height: 1.12;
            letter-spacing: -0.04em;
            color: #111827;
          }

          .pdf-heading-2 {
            margin: 24px 0 8px;
            font-size: 18px;
            line-height: 1.18;
            letter-spacing: -0.03em;
            color: #111827;
          }

          .pdf-paragraph,
          .pdf-empty {
            margin: 0 0 12px;
            font-size: 13px;
            line-height: 1.75;
            color: #374151;
            white-space: normal;
            word-break: break-word;
          }

          .pdf-todo {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 0 0 12px;
          }

          .pdf-todo-box {
            width: 18px;
            height: 18px;
            margin-top: 2px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #9ca3af;
            border-radius: 4px;
            color: transparent;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .pdf-todo-box--checked {
            border-color: #2563eb;
            background: #2563eb;
            color: #ffffff;
          }

          .pdf-todo-text {
            flex: 1;
            font-size: 13px;
            line-height: 1.75;
            color: #374151;
            word-break: break-word;
          }

          .pdf-code {
            margin: 8px 0 16px;
            padding: 14px 16px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
            font-size: 11px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            color: #111827;
          }

          .pdf-divider {
            margin: 18px 0;
            border: none;
            border-top: 1px solid #d1d5db;
          }

          .pdf-image-wrap {
            margin: 16px 0 18px;
          }

          .pdf-image {
            display: block;
            max-width: 100%;
            max-height: 520px;
            object-fit: contain;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            background: #f8fafc;
          }

          .pdf-image-placeholder {
            margin: 16px 0 18px;
            padding: 16px 18px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px dashed #d1d5db;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <article class="pdf-document">
          <h1 class="pdf-title">${escapeHtml(title || "Untitled document")}</h1>
          <p class="pdf-meta">Exported from BlockNote</p>
          ${content}
        </article>
      </body>
    </html>
  `;
}

export function EditorShell({ documentId, shareToken = "" }) {
  const { authorizedRequest, logout } = useAuth();
  const router = useRouter();
  const [blocks, setBlocks] = useState(() => [
    createBlankParagraphBlock(INITIAL_PLACEHOLDER_BLOCK_ID),
  ]);
  const [focusId, setFocusId] = useState(null);
  const [slashState, setSlashState] = useState(null);
  const [slashHighlight, setSlashHighlight] = useState(0);
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [docError, setDocError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [showBlockToolbar, setShowBlockToolbar] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [activeShareToken, setActiveShareToken] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");
  const blockToolbarRef = useRef(null);
  const blockToolbarBtnRef = useRef(null);
  const sharePopoverRef = useRef(null);
  const shareButtonRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isReadOnly = Boolean(shareToken);
  const shareUrl = useMemo(() => {
    if (!activeShareToken || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/share/${activeShareToken}`;
  }, [activeShareToken]);

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
    if (isReadOnly) {
      return;
    }

    setActiveDragId(event.active.id);
  }

  function handleDragCancel() {
    setActiveDragId(null);
  }

  function handleDragEnd(event) {
    if (isReadOnly) {
      setActiveDragId(null);
      return;
    }

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
    if (isReadOnly) {
      return;
    }

    setBlocks((current) => updater(current));
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
    if (isReadOnly) {
      return false;
    }

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
          return {
            ...block,
            type: "image",
            content: { url: "", width: 50, align: "center" },
          };
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
    if (isReadOnly) return;
    if (selectedBlockIds.length === 0) return;

    const selected = new Set(selectedBlockIds);
    setBlocksAndMarkDirty((current) =>
      assignOrderIndexes(current.filter((block) => !selected.has(block.id))),
    );
    setSelectedBlockIds([]);
    closeSlashMenu();
  }

  function addBlock(type = "paragraph") {
    if (isReadOnly) {
      return;
    }

    const newBlock = {
      id: generateId(),
      type,
      content:
        type === "divider"
          ? {}
          : type === "image"
            ? { url: "", width: 50, align: "center" }
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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

    setSelectedBlockIds((current) => {
      if (checked) {
        return current.includes(blockId) ? current : [...current, blockId];
      }

      return current.filter((id) => id !== blockId);
    });
  }

  function selectAllBlocks() {
    if (isReadOnly) {
      return;
    }

    setSelectedBlockIds(blocks.map((block) => block.id));
  }

  function toggleSelectAllBlocks() {
    if (isReadOnly) {
      return;
    }

    if (allBlocksSelected) {
      clearBlockSelection();
      return;
    }

    selectAllBlocks();
  }

  function clearBlockSelection() {
    setSelectedBlockIds([]);
  }

  function splitBlock(blockId, segments) {
    if (isReadOnly) {
      return;
    }

    setBlocksAndMarkDirty((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index === -1) return current;

      const currentBlock = current[index];
      const beforeText = segments.before ?? "";
      const afterText = segments.after ?? "";
      const isAtEnd = afterText.length === 0;

      let nextType = currentBlock.type;
      if (isAtEnd && currentBlock.type !== "code") {
        nextType = "paragraph";
      }

      const updatedBlock = {
        ...currentBlock,
        content: { ...currentBlock.content, text: beforeText },
      };

      const nextBlock = {
        id: generateId(),
        type: nextType,
        content:
          nextType === "todo"
            ? { text: afterText, checked: false }
            : nextType === "image"
              ? {
                  url: "",
                  width: currentBlock.content?.width ?? 50,
                  align: normalizeImageAlign(currentBlock.content?.align),
                }
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
    if (isReadOnly) {
      return;
    }

    setBlocksAndMarkDirty((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      if (index === -1) return current;

      const currentBlock = current[index];
      if (!isTextBlock(currentBlock) && currentBlock.type !== "image") return current;

      if (isTextBlock(currentBlock)) {
        const currentText = currentBlock.content?.text || "";
        if (currentText.length > 0 && currentText !== "\n") return current;
      } else if (currentBlock.type === "image") {
        const currentUrl = currentBlock.content?.url || "";
        if (currentUrl.length > 0) return current;
      }

      if (current.length === 1) {
        setFocusId(null);
        return [];
      }

      if (index <= 0) return current;

      const previousBlock = current[index - 1];

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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return false;
    }

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
    if (isReadOnly) {
      return;
    }

    if (!confirmBlockTypeChange(blockId, type)) return;

    setBlocksAndMarkDirty((current) =>
      current.map((block) => {
        if (block.id !== blockId) return block;
        if (type === "divider") return { ...block, type: "divider", content: {} };
        if (type === "image") {
          return {
            ...block,
            type: "image",
            content: { url: "", width: 50, align: "center" },
          };
        }
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

  useEffect(() => {
    if (!isShareDialogOpen) return;

    function handleClickOutside(event) {
      if (
        sharePopoverRef.current &&
        !sharePopoverRef.current.contains(event.target) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target)
      ) {
        setIsShareDialogOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isShareDialogOpen]);

  async function handleEnableShareLink() {
    if (!documentId) {
      return;
    }

    setShareBusy(true);
    setShareError("");
    setShareMessage("");

    try {
      const result = await authorizedRequest(`/documents/${documentId}/share`, {
        method: "POST",
      });
      setActiveShareToken(result.share?.shareToken || "");
      setShareMessage("Share link is ready to copy.");
    } catch (error) {
      setShareError(error.message || "Unable to create share link.");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyShareLink() {
    if (!shareUrl) {
      return handleEnableShareLink();
    }

    setShareError("");
    setShareMessage("");

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Share link copied.");
    } catch (error) {
      setShareError("Unable to copy link automatically.");
    }
  }

  async function handleExpireShareLink() {
    if (!documentId || !activeShareToken) {
      return;
    }

    setShareBusy(true);
    setShareError("");
    setShareMessage("");

    try {
      await authorizedRequest(`/documents/${documentId}/share`, {
        method: "DELETE",
      });
      setActiveShareToken("");
      setShareMessage("Share link expired.");
    } catch (error) {
      setShareError(error.message || "Unable to expire share link.");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      const html = buildPrintHtml(documentTitle, assignOrderIndexes(blocks));
      document.body.appendChild(iframe);

      await new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.srcdoc = html;
      });

      const printDocument = iframe.contentDocument;
      const printWindow = iframe.contentWindow;

      if (!printDocument || !printWindow) {
        throw new Error("Unable to prepare PDF export.");
      }

      const images = Array.from(printDocument.images || []);
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.onload = resolve;
                image.onerror = resolve;
              }),
        ),
      );

      const cleanup = () => {
        window.removeEventListener("afterprint", cleanup);
        printWindow.removeEventListener("afterprint", cleanup);
        window.clearTimeout(fallbackTimeout);
        iframe.remove();
      };

      const fallbackTimeout = window.setTimeout(cleanup, 5000);
      window.addEventListener("afterprint", cleanup, { once: true });
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      printWindow.focus();
      printWindow.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function saveDocument() {
    if (!documentId || isReadOnly) return;
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
    if (!documentId && !shareToken) {
      setIsLoadingDoc(false);
      return;
    }

    let cancelled = false;

    async function loadDocument() {
      setIsLoadingDoc(true);
      setDocError("");
      setIsForbidden(false);

      try {
        const result = shareToken
          ? await apiRequest(`/documents/shared/${shareToken}`)
          : await authorizedRequest(`/documents/${documentId}`);
        if (!cancelled) {
          /* Redirect removed to allow /share/:token to persist */
          const loadedBlocks = normalizeBlocks(result.document?.blocks || []);
          setBlocks(loadedBlocks);
          setDocumentTitle(result.document?.title || "Untitled document");
          setActiveShareToken(result.document?.shareToken || "");
          setDocumentLoaded(true);
          setSaveState(shareToken ? "shared" : "saved");
        }
      } catch (error) {
        if (!cancelled) {
          if (error.status === 403) {
            setIsForbidden(true);
          } else {
            setDocError(error.message || "Unable to load document.");
          }
        }
      } finally {
        if (!cancelled) setIsLoadingDoc(false);
      }
    }

    loadDocument();
    return () => { cancelled = true; };
  }, [authorizedRequest, documentId, router, shareToken]);

  useEffect(() => {
    if (isReadOnly || !documentLoaded || isLoadingDoc) return;

    setSaveState("dirty");
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => { saveDocument(); }, 800);
    return () => { window.clearTimeout(saveTimeoutRef.current); };
  }, [blocks, documentTitle, documentLoaded, isLoadingDoc, isReadOnly]);

  useEffect(() => {
    setSelectedBlockIds((current) =>
      current.filter((id) => blocks.some((block) => block.id === id)),
    );
  }, [blocks]);

  useEffect(() => {
    if (!isReadOnly) {
      return;
    }

    setShowBlockToolbar(false);
    setSelectedBlockIds([]);
    closeSlashMenu();
  }, [isReadOnly]);

  useEffect(() => {
    if (isReadOnly) {
      return;
    }

    if (!focusId) return;
    const element = document.querySelector(`[data-block-id="${focusId}"]`);
    if (element) {
      element.focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setFocusId(null);
  }, [focusId, blocks, isReadOnly]);

  const saveLabel =
    isReadOnly ? "Read only"
      : saveState === "saving" ? "Saving…"
      : saveState === "saved" ? "Saved"
        : saveState === "error" ? "Save failed"
          : "Unsaved";

  const saveClass =
    isReadOnly ? "save-pill save-pill--readonly"
      : saveState === "saved" ? "save-pill save-pill--saved"
      : saveState === "error" ? "save-pill save-pill--error"
        : saveState === "saving" ? "save-pill save-pill--saving"
          : "save-pill";
  const selectedCount = selectedBlockIds.length;
  const isSelectionMode = !isReadOnly && selectedCount > 0;
  const allBlocksSelected = blocks.length > 0 && selectedCount === blocks.length;
  const isEmptyDocument = blocks.length === 0;
  const backTitle = isReadOnly ? "Back" : "Back to documents";

  function handleBackNavigation() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(isReadOnly ? "/login" : "/dashboard");
  }

  if (isForbidden) {
    return <ForbiddenErrorView />;
  }

  return (
    <div className="editor-layout">
      {/* ── Sticky Top Bar ── */}
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button
            className="editor-back-btn"
            type="button"
            title={backTitle}
            onClick={handleBackNavigation}
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
              readOnly={isReadOnly}
            />
            {isReadOnly ? (
              <p className="editor-topbar-meta">Shared view. Editing is disabled.</p>
            ) : null}
          </div>
        </div>

        <div className="editor-topbar-right">
          <span className={saveClass}>{saveLabel}</span>

          <button
            className="editor-topbar-btn"
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoadingDoc || isDownloadingPdf}
            title="Download PDF"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L11 7M8 10L5 7M3 12.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isDownloadingPdf ? "Preparing..." : "Download PDF"}
          </button>

          {!isReadOnly ? (
            <>
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

              <div className="editor-share-wrapper">
                <button
                  ref={shareButtonRef}
                  className="editor-topbar-btn"
                  type="button"
                  onClick={() => {
                    setIsShareDialogOpen((current) => !current);
                    setShareMessage("");
                    setShareError("");
                  }}
                  title="Share document"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11 5.33C12.1 5.33 13 4.43 13 3.33C13 2.23 12.1 1.33 11 1.33C9.9 1.33 9 2.23 9 3.33C9 4.43 9.9 5.33 11 5.33ZM5 10.67C6.1 10.67 7 9.77 7 8.67C7 7.57 6.1 6.67 5 6.67C3.9 6.67 3 7.57 3 8.67C3 9.77 3.9 10.67 5 10.67ZM11 16C12.1 16 13 15.1 13 14C13 12.9 12.1 12 11 12C9.9 12 9 12.9 9 14C9 15.1 9.9 16 11 16ZM6.73 9.67L9.28 13M9.27 3.99L6.73 7.34" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Share
                </button>

                <div ref={sharePopoverRef}>
                  <ShareDialog
                    open={isShareDialogOpen}
                    shareUrl={shareUrl}
                    isShared={Boolean(activeShareToken)}
                    busy={shareBusy}
                    message={shareMessage}
                    error={shareError}
                    onEnable={handleEnableShareLink}
                    onCopy={handleCopyShareLink}
                    onExpire={handleExpireShareLink}
                    onClose={() => setIsShareDialogOpen(false)}
                  />
                </div>
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
            </>
          ) : null}
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
                {!isReadOnly && !isEmptyDocument ? (
                  <InsertBlockControl onInsert={() => insertParagraphAt(0)} />
                ) : null}
                {blocks.map((block, index) => (
                  <div className="editor-block-stack" key={block.id}>
                    <BlockRenderer
                      block={block}
                      readOnly={isReadOnly}
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
                    {!isReadOnly ? (
                      <InsertBlockControl onInsert={() => insertParagraphAt(index + 1)} />
                    ) : null}
                  </div>
                ))}
                {!isReadOnly && isEmptyDocument ? (
                  <div className="editor-empty-state">
                    <button
                      className="editor-empty-state-btn"
                      type="button"
                      onClick={() => addBlock()}
                    >
                      <span className="editor-empty-state-btn-icon">+</span>
                      <span>Add block</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </SortableContext>
            {!isReadOnly ? <DeleteDropZone visible={Boolean(activeDragId)} /> : null}
          </DndContext>

          {!isReadOnly && !isEmptyDocument ? (
            <div
              className="editor-click-to-add"
              onClick={() => addBlock()}
              role="button"
              tabIndex={0}
            />
          ) : null}
        </div>
      </main>

      {!isReadOnly ? (
        <>
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
            onToggleSelectAll={toggleSelectAllBlocks}
            onDelete={deleteSelectedBlocks}
            onCancel={clearBlockSelection}
          />

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
        </>
      ) : null}
    </div>
  );
}
