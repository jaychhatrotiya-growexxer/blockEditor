"use client";

import { useEffect, useRef } from "react";

const COMMANDS = [
  { type: "paragraph", label: "Paragraph", desc: "Plain text block", icon: "¶" },
  { type: "heading_1", label: "Heading 1", desc: "Large section heading", icon: "H1" },
  { type: "heading_2", label: "Heading 2", desc: "Medium section heading", icon: "H2" },
  { type: "todo", label: "To-do", desc: "Track tasks with a checkbox", icon: "☐" },
  { type: "code", label: "Code", desc: "Monospaced code block", icon: "</>" },
  { type: "divider", label: "Divider", desc: "Visual separator line", icon: "—" },
  { type: "image", label: "Image", desc: "Embed an image from URL", icon: "▣" },
];

export { COMMANDS };

export function getFilteredCommands(query) {
  return COMMANDS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
}

export function SlashMenu({ activeId, query, position, onSelect, highlightedIndex }) {
  const listRef = useRef(null);

  if (!activeId) {
    return null;
  }

  const filtered = getFilteredCommands(query);

  return (
    <div className="slash-menu" style={{ top: position.top, left: position.left }} ref={listRef}>
      <div className="slash-menu-header">Blocks</div>
      {filtered.length === 0 ? (
        <div className="slash-empty">No results for "{query}"</div>
      ) : (
        filtered.map((item, index) => (
          <button
            key={item.type}
            className={`slash-item${index === highlightedIndex ? " slash-item--highlighted" : ""}`}
            type="button"
            onClick={() => onSelect(item.type)}
          >
            <span className="slash-item-icon">{item.icon}</span>
            <span className="slash-item-text">
              <span className="slash-item-label">{item.label}</span>
              <span className="slash-item-desc">{item.desc}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
