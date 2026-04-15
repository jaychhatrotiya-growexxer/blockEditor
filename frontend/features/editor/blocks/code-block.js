"use client";

import { getCaretOffset } from "./selection";
import { useEditableBlock } from "./editable-block";

export function CodeBlock({
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
    <pre
      ref={elementRef}
      className="block-code block-editable"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      data-block-id={block.id}
      data-placeholder={readOnly ? "" : "Write code here"}
      onInput={readOnly ? undefined : handleInput}
      onBlur={readOnly ? undefined : commitChange}
      onKeyDown={(event) => {
        if (readOnly) {
          return;
        }

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
