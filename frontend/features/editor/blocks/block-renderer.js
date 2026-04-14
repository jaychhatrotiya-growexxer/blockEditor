"use client";

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
  onChange,
  onToggle,
  onSplit,
  onBackspace,
  onSlash,
  onChangeType,
  onDelete,
}) {
  const BlockComponent = BLOCK_COMPONENTS[block.type] || ParagraphBlock;

  return (
    <div className="editor-block" data-block-type={block.type}>
      <BlockMenu
        block={block}
        onChangeType={(type) => onChangeType?.(block.id, type)}
        onDelete={() => onDelete?.(block.id)}
      />
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
