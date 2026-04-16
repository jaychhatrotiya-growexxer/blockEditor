"use client";

import { getCaretOffset, getSplitSegments } from "./selection";
import { useEditableBlock } from "./editable-block";

export function HeadingBlock({
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

  if (block.type === "heading_1") {
    return (
      <h2
        ref={elementRef}
        className="block-heading block-heading-1 block-editable"
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

  return (
    <h3
      ref={elementRef}
      className="block-heading block-heading-2 block-editable"
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
