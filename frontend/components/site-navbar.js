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
          {showGuestActions ? (
            <Link href="/login" className="site-navbar-link-btn">
              Login
            </Link>
          ) : null}
          {showGuestActions ? (
            <Link href="/register" className="site-navbar-cta">
              Create account
            </Link>
          ) : null}
          {showDashboardAction ? (
            <Link href="/dashboard" className="site-navbar-cta">
              Open dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
