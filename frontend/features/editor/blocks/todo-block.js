"use client";

import { getCaretOffset, getSplitSegments } from "./selection";
import { useEditableBlock } from "./editable-block";

export function TodoBlock({
  block,
  onChange,
  onToggle,
  onSplit,
  onBackspace,
  onSlash,
}) {
  const checked = Boolean(block.content?.checked);
  const { elementRef, handleInput, commitChange } = useEditableBlock(
    block,
    onChange,
  );

  return (
    <div className="block-todo">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle?.(event.target.checked)}
      />
      <span
        ref={elementRef}
        className="block-editable"
        contentEditable
        suppressContentEditableWarning
        data-block-id={block.id}
        data-placeholder="New to-do"
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
    </div>
  );
}
