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
          <div className="skeleton skeleton-title" style={{ width: "40%", margin: "0 0 20px" }} />
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-block" style={{ width: "80%" }} />
          <div className="skeleton skeleton-block" style={{ width: "60%" }} />
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
