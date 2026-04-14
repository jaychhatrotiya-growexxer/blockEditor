"use client";

import { useState, useEffect } from "react";

export function ImageBlock({ block, onChange }) {
  const url = block.content?.url || "";
  const alt = block.content?.alt || "";
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!url);

  useEffect(() => {
    if (url) {
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
      setIsEditing(true);
    }
  }, [url]);

  const handleUrlChange = (newUrl) => {
    onChange?.({ url: newUrl });
  };

  const handleAltChange = (newAlt) => {
    onChange?.({ alt: newAlt });
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    setIsEditing(false); // Hide the inputs once successfully loaded
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    setIsEditing(true); // Keep inputs open if there's an error
  };

  const handleWrapperBlur = (e) => {
    // Hide inputs if clicking outside the block and we have a valid image loaded
    if (!e.currentTarget.contains(e.relatedTarget) && url && !imageError && !imageLoading) {
      setIsEditing(false);
    }
  };

  return (
    <div 
      className="block-image-wrapper" 
      tabIndex={-1} 
      onBlur={handleWrapperBlur} 
      style={{ outline: "none" }}
    >
      {isEditing && (
        <>
          <input
            className="block-image-input"
            type="url"
            placeholder="Paste image URL"
            value={url}
            onChange={(event) => handleUrlChange(event.target.value)}
            autoFocus={!url}
          />
          <input
            className="block-image-input"
            type="text"
            placeholder="Image alt text (optional)"
            value={alt}
            onChange={(event) => handleAltChange(event.target.value)}
          />
        </>
      )}
      {url ? (
        <div 
          className="block-image-container"
          onClick={() => setIsEditing(true)}
          title="Click to edit image details"
          style={{ cursor: isEditing ? "default" : "pointer" }}
        >
          <img
            className="block-image"
            src={url}
            alt={alt || "Image"}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageLoading && (
            <div className="block-image-loading">Loading...</div>
          )}
          {imageError && (
            <div className="block-image-error">
              Failed to load image. Check the URL.
            </div>
          )}
        </div>
      ) : (
        <div className="block-image-placeholder">
          Enter an image URL above to display the image
        </div>
      )}
    </div>
  );
}
