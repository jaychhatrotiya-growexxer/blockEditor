"use client";

import { getCaretOffset, getSplitSegments } from "./selection";
import { useEditableBlock } from "./editable-block";

export function ParagraphBlock({
  block,
  readOnly,
  onChange,
  onSplit,
  onBackspace,
  onSlash,
}) {
  const { elementRef, handleInput, commitChange } = useEditableBlock(
    block,
    onChange,
  );

  return (
    <p
      ref={elementRef}
      className="block-paragraph block-editable"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      data-block-id={block.id}
      data-placeholder={readOnly ? "" : "Type '/' for commands"}
      onInput={readOnly ? undefined : handleInput}
      onBlur={readOnly ? undefined : commitChange}
      onKeyDown={(event) => {
        if (readOnly) {
          return;
        }

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
          const currentText = event.currentTarget.innerText || "";

          if (caretOffset === 0 || currentText.length === 0 || currentText === "\n") {
            event.preventDefault();
            onBackspace?.();
          }
        }
      }}
    />
  );
}
