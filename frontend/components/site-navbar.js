"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";

export function SiteNavbar() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const showGuestActions = !isBootstrapping && !isAuthenticated;
  const showDashboardAction = !isBootstrapping && isAuthenticated;

  return (
    <header className="site-navbar-shell">
      <div className="site-navbar">
        <Link href="/" className="site-navbar-brand" aria-label="BlockNote home">
          <span className="site-navbar-brand-mark">B</span>
          <span className="site-navbar-brand-text">
            <strong>BlockNote</strong>
            <span>Focused document workflows</span>
          </span>
        </Link>

        <nav className="site-navbar-links" aria-label="Primary">
          <Link href="/#features">Features</Link>
          <Link href="/#workflow">Workflow</Link>
          <Link href="/#sharing">Sharing</Link>
        </nav>

        <div className="site-navbar-actions">
          {showDashboardAction ? (
            <Link href="/dashboard" className="site-navbar-cta">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={isBootstrapping ? "skeleton-btn--sm skeleton" : "site-navbar-link-btn"}
                style={isBootstrapping ? { width: "60px" } : {}}
              >
                {isBootstrapping ? "" : "Login"}
              </Link>
              <Link
                href="/register"
                className={isBootstrapping ? "skeleton-btn--sm skeleton" : "site-navbar-cta"}
                style={isBootstrapping ? { width: "120px" } : {}}
              >
                {isBootstrapping ? "" : "Create account"}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
