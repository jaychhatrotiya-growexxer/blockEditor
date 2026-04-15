"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { useAuth } from "./auth-context";

export function ProtectedPage({ children, variant = "dashboard" }) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user, logout } = useAuth();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping) {
    return (
      <main className="auth-shell">
        <section className="dashboard-panel">
          <p className="auth-loading">Restoring your session...</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (variant === "editor") {
    return (
      <div className="editor-page">
        {children}
      </div>
    );
  }

  return (
    <div className="site-shell">
      <SiteNavbar />
      <main className="dashboard-shell dashboard-shell--with-navbar">
        <section className="dashboard-panel">
          <p className="dashboard-kicker">{user.email}</p>
          {children}
          <div className="dashboard-actions">
            <button className="auth-secondary" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
