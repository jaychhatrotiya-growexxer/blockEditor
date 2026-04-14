"use client";

export function getSplitSegments(element) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !element.contains(selection.anchorNode)) {
    const text = element.textContent || "";
    return { before: text, after: "" };
  }

  const range = selection.getRangeAt(0);
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(element);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  const afterRange = range.cloneRange();
  afterRange.selectNodeContents(element);
  afterRange.setStart(range.endContainer, range.endOffset);

  return {
    before: beforeRange.toString(),
    after: afterRange.toString(),
  };
}

export function getCaretOffset(element) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !element.contains(selection.anchorNode)) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(element);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  return beforeRange.toString().length;
}
