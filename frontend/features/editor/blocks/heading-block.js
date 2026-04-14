"use client";

import { getCaretOffset, getSplitSegments } from "./selection";
import { useEditableBlock } from "./editable-block";

export function HeadingBlock({
  block,
  onChange,
  onSplit,
  onBackspace,
  onSlash,
}) {
  const { elementRef, handleInput, commitChange } = useEditableBlock(
    block,
    onChange,
  );

  if (block.type === "heading_1") {
    return (
      <h2
        ref={elementRef}
        className="block-heading block-heading-1 block-editable"
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        data-placeholder="Type '/' for commands"
        onInput={handleInput}
        onBlur={commitChange}
        onKeyDown={(event) => {
          if (onSlash?.(event)) {
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            const { before, after } = getSplitSegments(event.currentTarget);
            onSplit?.({ before, after });
          }

          if (event.key === "Backspace") {
            const caretOffset = getCaretOffset(event.currentTarget);

            if (caretOffset === 0) {
              event.preventDefault();
              onBackspace?.();
            }
          }
        }}
      />
    );
  }

  return (
    <h3
      ref={elementRef}
      className="block-heading block-heading-2 block-editable"
      contentEditable
      suppressContentEditableWarning
      data-block-id={block.id}
      data-placeholder="Type '/' for commands"
      onInput={handleInput}
      onBlur={commitChange}
      onKeyDown={(event) => {
        if (onSlash?.(event)) {
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const { before, after } = getSplitSegments(event.currentTarget);
          onSplit?.({ before, after });
        }

        if (event.key === "Backspace") {
          const caretOffset = getCaretOffset(event.currentTarget);

          if (caretOffset === 0) {
            event.preventDefault();
            onBackspace?.();
          }
        }
      }}
    />
  );
}
