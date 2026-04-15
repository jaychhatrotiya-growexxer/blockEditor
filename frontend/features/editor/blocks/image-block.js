"use client";

import { useEffect, useRef, useState } from "react";

export function ImageBlock({ block, readOnly, onChange }) {
  const url = block.content?.url || "";
  const [draftUrl, setDraftUrl] = useState(url);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!url);
  const inputRef = useRef(null);
  const imageRef = useRef(null);

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

    onChange?.({ url: nextUrl });
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

  return (
    <div
      className="block-image-wrapper"
      tabIndex={-1}
      onBlur={handleWrapperBlur}
      style={{ outline: "none" }}
    >
      {readOnly ? (
        url ? (
          <div className="block-image-static">
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
        <button
          className="block-image-container"
          onClick={openEditor}
          title="Click to edit image URL"
          type="button"
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
        </button>
      ) : (
        <div className="block-image-placeholder">
          Enter an image URL above to display the image
        </div>
      )}
    </div>
  );
}
