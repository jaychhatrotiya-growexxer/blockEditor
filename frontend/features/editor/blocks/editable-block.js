"use client";

import { useEffect, useRef } from "react";

export function useEditableBlock(block, onChange) {
  const elementRef = useRef(null);
  const currentTextRef = useRef(block.content?.text || "");
  const lastEmittedTextRef = useRef(null);

  function emitChange(nextText) {
    const previousText = block.content?.text || "";

    if (nextText !== previousText) {
      lastEmittedTextRef.current = nextText;
      onChange?.({ text: nextText });
    }
  }

  useEffect(() => {
    const element = elementRef.current;
    const nextText = block.content?.text || "";

    if (!element) {
      currentTextRef.current = nextText;
      return;
    }

    if (lastEmittedTextRef.current === nextText) {
      return;
    }

    if (element.textContent !== nextText) {
      element.textContent = nextText;
    }

    currentTextRef.current = nextText;
  }, [block.id, block.content?.text]);

  function handleInput(event) {
    const nextText = event.currentTarget.innerText || "";
    currentTextRef.current = nextText;
    emitChange(nextText);
  }

  function commitChange() {
    emitChange(currentTextRef.current);
  }

  return {
    elementRef,
    handleInput,
    commitChange,
  };
}
