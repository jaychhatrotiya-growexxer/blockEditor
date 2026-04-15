"use client";

import { useState, useEffect, useRef } from "react";

const BLOCK_TYPES = [
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "heading_1", label: "Heading 1", icon: "H1" },
  { type: "heading_2", label: "Heading 2", icon: "H2" },
  { type: "todo", label: "To-do", icon: "☐" },
  { type: "code", label: "Code", icon: "</>" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "image", label: "Image", icon: "▣" },
];

export function BlockMenu({ block, onChangeType, onDelete, dragHandleProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className={`block-handle${isOpen ? " block-handle--open" : ""}`} ref={menuRef}>
      <button
        className="block-handle-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Click to open menu"
        aria-label="Block options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        {...(dragHandleProps || {})}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="5" cy="3" r="1.2" />
          <circle cx="9" cy="3" r="1.2" />
          <circle cx="5" cy="7" r="1.2" />
          <circle cx="9" cy="7" r="1.2" />
          <circle cx="5" cy="11" r="1.2" />
          <circle cx="9" cy="11" r="1.2" />
        </svg>
      </button>
      {isOpen && (
        <div className="block-handle-dropdown" role="menu" aria-label="Block options">
          {block.type !== "divider" && (
            <>
              <div className="block-handle-section">
                <span className="block-handle-label">Turn into</span>
                {BLOCK_TYPES.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    className={`block-handle-item${block.type === type ? " block-handle-item--active" : ""}`}
                    onClick={() => {
                      onChangeType(type);
                      setIsOpen(false);
                    }}
                    type="button"
                    role="menuitem"
                  >
                    <span className="block-handle-item-icon">{icon}</span>
                    <span className="block-handle-item-text">
                      <span className="block-handle-item-title">{label}</span>
                      <span className="block-handle-item-meta">
                        {block.type === type ? "Current block" : "Convert block"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="block-handle-divider" />
            </>
          )}
          <button
            className="block-handle-item block-handle-item--danger"
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            type="button"
            role="menuitem"
          >
            <span className="block-handle-item-icon">✕</span>
            <span className="block-handle-item-text">
              <span className="block-handle-item-title">Delete</span>
              <span className="block-handle-item-meta">Remove this block</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
