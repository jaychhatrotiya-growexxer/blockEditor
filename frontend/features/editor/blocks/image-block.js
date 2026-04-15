"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_IMAGE_WIDTH = 50;
const IMAGE_SIZE_PRESETS = [35, 50, 70, 100];
const IMAGE_ALIGNMENT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

function clampImageWidth(value) {
  const width = Number(value);

  if (Number.isNaN(width)) {
    return DEFAULT_IMAGE_WIDTH;
  }

  return Math.min(100, Math.max(20, Math.round(width)));
}

function normalizeImageAlign(value) {
  return ["left", "center", "right"].includes(value) ? value : "center";
}

function blurTrigger(target) {
  if (target instanceof HTMLElement) {
    target.blur();
  }
}

export function ImageBlock({
  block,
  readOnly,
  showResizeControls,
  onCloseResizeControls,
  onChange,
}) {
  const url = block.content?.url || "";
  const imageWidth = clampImageWidth(block.content?.width);
  const imageAlign = normalizeImageAlign(block.content?.align);
  const [draftUrl, setDraftUrl] = useState(url);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!url);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);

  useEffect(() => {
    if (readOnly) {
      setIsEditing(false);
      setImageError(false);
      setImageLoading(false);
      return;
    }

    setDraftUrl(url);
    if (!url) {
      setImageLoading(false);
      setImageError(false);
      setIsEditing(true);
      return;
    }

    if (!isEditing) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [readOnly, url, isEditing]);

  useEffect(() => {
    if (readOnly || !isEditing || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
  }, [isEditing, readOnly]);

  useEffect(() => {
    if (!url || isEditing || !imageRef.current?.complete) return;

    if (imageRef.current.naturalWidth > 0) {
      setImageLoading(false);
      setImageError(false);
      return;
    }

    setImageLoading(false);
    setImageError(true);
    setIsEditing(true);
  }, [url, isEditing]);

  useEffect(() => {
    if (!isResizing || readOnly) {
      return undefined;
    }

    function handlePointerMove(event) {
      const containerRect = imageContainerRef.current?.getBoundingClientRect();

      if (!containerRect?.width) {
        return;
      }

      let nextWidth;

      if (imageAlign === "left") {
        nextWidth = ((event.clientX - containerRect.left) / containerRect.width) * 100;
      } else if (imageAlign === "right") {
        nextWidth = ((containerRect.right - event.clientX) / containerRect.width) * 100;
      } else {
        const centerX = containerRect.left + containerRect.width / 2;
        nextWidth =
          (Math.abs(event.clientX - centerX) * 2 / containerRect.width) * 100;
      }

      handleResize(nextWidth);
    }

    function finishResize() {
      setIsResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, [handleResize, imageAlign, isResizing, readOnly]);

  function openEditor() {
    if (readOnly) {
      return;
    }

    setDraftUrl(url);
    setImageError(false);
    setIsEditing(true);
  }

  function finishEditing() {
    const nextUrl = draftUrl.trim();

    if (nextUrl === url) {
      setDraftUrl(url);
      setImageError(false);
      setIsEditing(!url);
      return;
    }

    onChange?.({ url: nextUrl, width: imageWidth, align: imageAlign });
    setImageError(false);
    setImageLoading(Boolean(nextUrl));
    setIsEditing(false);
  }

  function cancelEditing() {
    setDraftUrl(url);
    setImageError(false);
    setIsEditing(!url);
  }

  function handleWrapperBlur(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    finishEditing();
  }

  function handleImageLoad() {
    setImageLoading(false);
    setImageError(false);
  }

  function handleImageError() {
    setImageLoading(false);
    setImageError(true);
    setIsEditing(true);
  }

  function handleResize(nextWidth) {
    onChange?.({ width: clampImageWidth(nextWidth) });
  }

  function handleAlign(nextAlign) {
    onChange?.({ align: normalizeImageAlign(nextAlign) });
  }

  function handleResizeStart(event) {
    if (readOnly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
  }

  const imageLayoutStyle = {
    "--block-image-width": `${imageWidth}%`,
    "--block-image-justify":
      imageAlign === "left"
        ? "flex-start"
        : imageAlign === "right"
          ? "flex-end"
          : "center",
  };
  const showExpandedResizeControls = showResizeControls || isResizing;

  return (
    <div
      className={`block-image-wrapper${showResizeControls ? " block-image-wrapper--controls-pinned" : ""}${isResizing ? " block-image-wrapper--resizing" : ""}`}
      tabIndex={-1}
      onBlur={handleWrapperBlur}
      style={{ outline: "none" }}
    >
      {readOnly ? (
        url ? (
          <div className="block-image-static" style={imageLayoutStyle}>
            <div className="block-image-frame">
              <img
                ref={imageRef}
                className="block-image"
                src={url}
                alt=""
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {imageLoading ? (
                <div className="block-image-loading">Loading...</div>
              ) : null}
              {imageError ? (
                <div className="block-image-error">Image could not be loaded.</div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="block-image-placeholder">
            No image was added to this block.
          </div>
        )
      ) : isEditing ? (
        <div className="block-image-editor">
          <input
            ref={inputRef}
            className="block-image-input"
            type="url"
            placeholder="Paste image URL"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishEditing();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
              }
            }}
          />
          {imageError ? (
            <div className="block-image-error-inline">
              Failed to load image. Check the URL.
            </div>
          ) : null}
        </div>
      ) : url ? (
        <>
          <div
            className={`block-image-controls${showExpandedResizeControls ? " block-image-controls--resize" : " block-image-controls--align-only"}`}
          >
            <div className="block-image-controls-header">
              <span>
                {showExpandedResizeControls ? "Image size" : "Justify image"}
              </span>
              <div className="block-image-controls-meta">
                {showExpandedResizeControls ? <span>{imageWidth}%</span> : null}
                {showResizeControls ? (
                  <button
                    className="block-image-controls-close"
                    type="button"
                    onClick={(event) => {
                      onCloseResizeControls?.();
                      blurTrigger(event.currentTarget);
                    }}
                  >
                    Done
                  </button>
                ) : null}
              </div>
            </div>
            {showExpandedResizeControls ? (
              <div className="block-image-preset-row">
                {IMAGE_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={`block-image-preset-btn${imageWidth === preset ? " block-image-preset-btn--active" : ""}`}
                    type="button"
                    onClick={(event) => {
                      handleResize(preset);
                      blurTrigger(event.currentTarget);
                    }}
                  >
                    {preset === 100 ? "Full" : `${preset}%`}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="block-image-align-row">
              {IMAGE_ALIGNMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`block-image-preset-btn${imageAlign === option.value ? " block-image-preset-btn--active" : ""}`}
                  type="button"
                  onClick={(event) => {
                    handleAlign(option.value);
                    blurTrigger(event.currentTarget);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={imageContainerRef}
            className="block-image-container"
            style={imageLayoutStyle}
          >
            <div
              className="block-image-frame block-image-frame--editable"
              role="button"
              tabIndex={0}
              onClick={openEditor}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEditor();
                }
              }}
              title="Click to edit image URL"
            >
              <img
                ref={imageRef}
                className="block-image"
                src={url}
                alt=""
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {imageLoading ? (
                <div className="block-image-loading">Loading...</div>
              ) : null}
              <button
                className="block-image-resize-handle"
                type="button"
                aria-label="Resize image"
                title="Drag to resize image"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={handleResizeStart}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M4 10L10 4M7 10L10 7M10 10L10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 13H13V4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.55"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="block-image-placeholder">
          Enter an image URL above to display the image
        </div>
      )}
    </div>
  );
}
