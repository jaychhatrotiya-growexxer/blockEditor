"use client";

import { getCaretOffset } from "./selection";
import { useEditableBlock } from "./editable-block";

export function CodeBlock({ block, onChange, onSplit, onBackspace, onSlash }) {
  const { elementRef, handleInput, commitChange } = useEditableBlock(
    block,
    onChange,
  );

  return (
    <pre
      ref={elementRef}
      className="block-code block-editable"
      contentEditable
      suppressContentEditableWarning
      data-block-id={block.id}
      data-placeholder="Write code here"
      onInput={handleInput}
      onBlur={commitChange}
      onKeyDown={(event) => {
        if (onSlash?.(event)) {
          return;
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
