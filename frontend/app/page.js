"use client";

import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { useAuth } from "@/features/auth/auth-context";

export default function HomePage() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const showGuestActions = !isBootstrapping && !isAuthenticated;
  const showDashboardAction = !isBootstrapping && isAuthenticated;

  return (
    <PublicPageShell>
      <main className="landing-page">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">Block-based writing, without the clutter</p>
            <h1>Write, organize, and share documents from one calm workspace.</h1>
            <p className="landing-lead">
              BlockNote gives your team a clear editor, dependable autosave,
              and shareable read-only links wrapped in a polished workspace.
            </p>

            <div className="landing-hero-actions">
              {showDashboardAction ? (
                <Link href="/dashboard" className="auth-submit">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className={`auth-submit ${isBootstrapping ? "skeleton" : ""}`}
                    style={isBootstrapping ? { minWidth: "160px", color: "transparent" } : {}}
                  >
                    {isBootstrapping ? "Creating account" : "Create account"}
                  </Link>
                  <Link
                    href="/login"
                    className={`auth-secondary ${isBootstrapping ? "skeleton" : ""}`}
                    style={isBootstrapping ? { minWidth: "100px", color: "transparent" } : {}}
                  >
                    {isBootstrapping ? "Signing in" : "Sign in"}
                  </Link>
                </>
              )}
            </div>

            <div className="landing-metrics">
              <div className="landing-metric-card">
                <strong>Fast editing</strong>
                <span>Block commands, drag ordering, and quick inline updates.</span>
              </div>
              <div className="landing-metric-card">
                <strong>Reliable saves</strong>
                <span>Autosave keeps document changes moving quietly in the background.</span>
              </div>
              <div className="landing-metric-card">
                <strong>Simple sharing</strong>
                <span>Read-only links let anyone review work without changing it.</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-preview">
            <div className="landing-preview-window">
              <div className="landing-preview-topbar">
                <span className="landing-preview-pill landing-preview-pill--saved">
                  Saved
                </span>
                <span className="landing-preview-chip">Share link ready</span>
              </div>

              <div className="landing-preview-title">Product launch brief</div>
              <div className="landing-preview-blocks">
                <div className="landing-preview-block">
                  <span className="landing-preview-label">H1</span>
                  <div>
                    <strong>Q2 launch narrative</strong>
                    <p>One connected space for outlines, code notes, and stakeholder review.</p>
                  </div>
                </div>
                <div className="landing-preview-block">
                  <span className="landing-preview-label">[]</span>
                  <div>
                    <strong>Review checklist</strong>
                    <p>Finalize copy, attach assets, send read-only link, track approvals.</p>
                  </div>
                </div>
                <div className="landing-preview-block">
                  <span className="landing-preview-label">/</span>
                  <div>
                    <strong>Slash-powered editing</strong>
                    <p>Turn paragraphs into headings, code, todos, dividers, or images instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-heading">
            <p className="landing-kicker">Core features</p>
            <h2>Built for clear writing and steady collaboration.</h2>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <span className="landing-feature-icon">01</span>
              <h3>Structured block editor</h3>
              <p>
                Use paragraphs, headings, todos, code, dividers, and images in a layout
                that stays readable as documents grow.
              </p>
            </article>
            <article className="landing-feature-card">
              <span className="landing-feature-icon">02</span>
              <h3>Autosave that stays out of the way</h3>
              <p>
                Keep working while the editor saves changes in the background with a
                gentle debounce instead of disruptive prompts.
              </p>
            </article>
            <article className="landing-feature-card">
              <span className="landing-feature-icon">03</span>
              <h3>Read-only sharing controls</h3>
              <p>
                Generate a link for review, copy it quickly, and expire it whenever the
                document should no longer be accessible.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section landing-section--split" id="workflow">
          <div className="landing-section-heading">
            <p className="landing-kicker">Workflow</p>
            <h2>A quieter way to move from first draft to final review.</h2>
          </div>

          <div className="landing-timeline">
            <div className="landing-timeline-step">
              <strong>Create a document</strong>
              <p>Start with an initial writing block so the page is ready the moment you enter.</p>
            </div>
            <div className="landing-timeline-step">
              <strong>Shape content with blocks</strong>
              <p>Mix headings, code, checklists, and media while keeping the layout organized.</p>
            </div>
            <div className="landing-timeline-step">
              <strong>Share when the draft is ready</strong>
              <p>Send a polished read-only link for review and expire it when the window closes.</p>
            </div>
          </div>
        </section>

        <section className="landing-section" id="sharing">
          <div className="landing-share-panel">
            <div>
              <p className="landing-kicker">Sharing</p>
              <h2>Professional handoff, simple controls.</h2>
              <p className="landing-lead landing-lead--compact">
                Owners control when a shared document is visible. Reviewers get a clean,
                read-only view that keeps the source document protected.
              </p>
            </div>

            <div className="landing-share-details">
              <div className="landing-share-item">
                <strong>Copyable link</strong>
                <span>Generate once, paste anywhere, and open directly into the document.</span>
              </div>
              <div className="landing-share-item">
                <strong>Read-only mode</strong>
                <span>Viewers can read content without editing blocks or changing structure.</span>
              </div>
              <div className="landing-share-item">
                <strong>Owner-controlled expiry</strong>
                <span>Turn access off instantly when the review cycle is complete.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
