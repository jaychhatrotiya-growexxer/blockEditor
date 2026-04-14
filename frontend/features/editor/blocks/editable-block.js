"use client";

import { useEffect, useRef } from "react";

export function useEditableBlock(block, onChange) {
  const elementRef = useRef(null);
  const currentTextRef = useRef(block.content?.text || "");

  useEffect(() => {
    const element = elementRef.current;
    const nextText = block.content?.text || "";

    if (!element) {
      currentTextRef.current = nextText;
      return;
    }

    if (element.textContent !== nextText) {
      element.textContent = nextText;
    }

    currentTextRef.current = nextText;
  }, [block.id, block.content?.text]);

  function handleInput(event) {
    currentTextRef.current = event.currentTarget.textContent || "";
  }

  function commitChange() {
    const nextText = currentTextRef.current;
    const previousText = block.content?.text || "";

    if (nextText !== previousText) {
      onChange?.({ text: nextText });
    }
  }

  return {
    elementRef,
    handleInput,
    commitChange,
  };
}
