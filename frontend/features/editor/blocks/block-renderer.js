"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CodeBlock } from "./code-block";
import { DividerBlock } from "./divider-block";
import { HeadingBlock } from "./heading-block";
import { ImageBlock } from "./image-block";
import { ParagraphBlock } from "./paragraph-block";
import { TodoBlock } from "./todo-block";
import { BlockMenu } from "./block-menu";

const BLOCK_COMPONENTS = {
  paragraph: ParagraphBlock,
  heading_1: HeadingBlock,
  heading_2: HeadingBlock,
  todo: TodoBlock,
  code: CodeBlock,
  divider: DividerBlock,
  image: ImageBlock,
};

export function BlockRenderer({
  block,
  isSelected,
  showSelectionControls,
  onSelectChange,
  onChange,
  onToggle,
  onSplit,
  onBackspace,
  onSlash,
  onChangeType,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 30 : undefined,
    position: "relative",
  };

  const BlockComponent = BLOCK_COMPONENTS[block.type] || ParagraphBlock;

  return (
    <div
      className={`editor-block${isSelected ? " editor-block--selected" : ""}${showSelectionControls ? " editor-block--selection-mode" : ""}`}
      data-block-type={block.type}
      ref={setNodeRef}
      style={style}
    >
      <BlockMenu
        block={block}
        onChangeType={(type) => onChangeType?.(block.id, type)}
        onDelete={() => onDelete?.(block.id)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      <label className="editor-block-select" onMouseDown={(event) => event.stopPropagation()}>
        <input
          className="editor-block-select-input"
          type="checkbox"
          checked={Boolean(isSelected)}
          onChange={(event) => onSelectChange?.(block.id, event.target.checked)}
          aria-label="Select block"
        />
        <span className="editor-block-select-box" aria-hidden="true" />
      </label>
      <div className="editor-block-content">
        <BlockComponent
          block={block}
          onChange={onChange}
          onToggle={onToggle}
          onSplit={onSplit}
          onBackspace={onBackspace}
          onSlash={onSlash}
        />
      </div>
    </div>
  );
}
