"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

function formatTimestamp(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DocumentsList() {
  const router = useRouter();
  const { authorizedRequest } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  const sortedDocuments = useMemo(() => {
    return [...documents].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return sortedDocuments;
    }

    return sortedDocuments.filter((document) =>
      document.title.toLowerCase().includes(query),
    );
  }, [searchQuery, sortedDocuments]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      setError("");
      setErrorDetails("");

      try {
        const result = await authorizedRequest("/documents");

        if (!cancelled) {
          setDocuments(result.documents || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load documents.");
          setErrorDetails(formatValidationDetails(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [authorizedRequest]);

  async function handleCreate() {
    setBusyId("create");
    setError("");
    setErrorDetails("");

    try {
      const result = await authorizedRequest("/documents", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled document" }),
      });

      setDocuments((current) => [result.document, ...current]);
      setEditingId(result.document.id);
      setEditingTitle(result.document.title);
    } catch (createError) {
      setError(createError.message || "Unable to create document.");
      setErrorDetails(formatValidationDetails(createError));
    } finally {
      setBusyId(null);
    }
  }

  function startEditing(document) {
    setEditingId(document.id);
    setEditingTitle(document.title);
  }

  function stopEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveTitle(document) {
    if (busyId === document.id) {
      return;
    }

    const nextTitle = editingTitle.trim();

    if (!nextTitle) {
      setError("Title cannot be empty.");
      return;
    }

    if (nextTitle === document.title) {
      stopEditing();
      return;
    }

    setBusyId(document.id);
    setError("");
    setErrorDetails("");

    try {
      const result = await authorizedRequest(`/documents/${document.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle }),
      });

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id ? result.document : item,
        ),
      );
      stopEditing();
    } catch (updateError) {
      setError(updateError.message || "Unable to rename document.");
      setErrorDetails(formatValidationDetails(updateError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(document) {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(document.id);
    setError("");
    setErrorDetails("");

    try {
      await authorizedRequest(`/documents/${document.id}`, {
        method: "DELETE",
      });

      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete document.");
      setErrorDetails(formatValidationDetails(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleShare(document) {
    const shareBusyId = `share:${document.id}`;

    setBusyId(shareBusyId);
    setError("");
    setErrorDetails("");
    setShareMessage("");

    try {
      const result = await authorizedRequest(`/documents/${document.id}/share`, {
        method: "POST",
      });

      const shareToken = result.share?.shareToken;
      const shareUrl = `${window.location.origin}/documents/${document.id}?share=${shareToken}`;

      await navigator.clipboard.writeText(shareUrl);

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id ? { ...item, isPublic: true } : item,
        ),
      );
      setShareMessage(`Share link copied for "${document.title}".`);
    } catch (shareError) {
      setError(shareError.message || "Unable to share document.");
      setErrorDetails(formatValidationDetails(shareError));
    } finally {
      setBusyId(null);
    }
  }

  function formatValidationDetails(error) {
    const details = error?.payload?.error?.details;
    if (!details || !details.fieldErrors) {
      return "";
    }

    const messages = Object.entries(details.fieldErrors)
      .flatMap(([field, messages]) =>
        (messages || []).map((message) => `${field}: ${message}`),
      )
      .filter(Boolean);

    return messages.join(", ");
  }

  return (
    <section className="documents-card">
      <div className="documents-header">
        <div>
          <p className="documents-eyebrow">Documents</p>
          <h2>Your workspace</h2>
        </div>
        <div className="documents-toolbar">
          <input
            className="documents-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
          />
        </div>
        <button
          className="auth-submit"
          type="button"
          onClick={handleCreate}
          disabled={busyId}
        >
          {busyId === "create" ? "Creating..." : "New document"}
        </button>
      </div>

      {error ? (
        <p className="auth-error">
          {error}
          {errorDetails ? ` (${errorDetails})` : ""}
        </p>
      ) : null}

      {shareMessage ? (
        <p className="documents-share-success">{shareMessage}</p>
      ) : null}

      {isLoading ? (
        <div className="documents-list">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="documents-empty">
          <p>No documents yet. Create your first one to get started.</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="documents-empty">
          <p>No documents match your search.</p>
        </div>
      ) : (
        <ul className="documents-list">
          {filteredDocuments.map((document) => {
            const isEditing = editingId === document.id;
            const isBusy = busyId === document.id;
            const isShareBusy = busyId === `share:${document.id}`;

            return (
              <li key={document.id} className="documents-row">
                <div className="documents-title">
                  {isEditing ? (
                    <>
                      <input
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveTitle(document);
                          }

                          if (event.key === "Escape") {
                            event.preventDefault();
                            stopEditing();
                          }
                        }}
                        disabled={isBusy}
                        autoFocus
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      className="documents-title-button"
                      onClick={() => router.push(`/documents/${document.id}`)}
                    >
                      {document.title}
                    </button>
                  )}
                  <span>{formatTimestamp(document.updatedAt)}</span>
                </div>
                <div className="documents-actions">
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() => handleShare(document)}
                    disabled={isBusy || isShareBusy}
                  >
                    {isShareBusy
                      ? "Sharing..."
                      : document.isPublic
                        ? "Copy link"
                        : "Share"}
                  </button>
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() => router.push(`/documents/${document.id}`)}
                    disabled={isBusy}
                  >
                    Open
                  </button>
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() =>
                      isEditing ? saveTitle(document) : startEditing(document)
                    }
                    disabled={isBusy}
                  >
                    {isEditing ? "Save" : "Rename"}
                  </button>
                  <button
                    className="documents-danger"
                    type="button"
                    onClick={() => handleDelete(document)}
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
