"use client";

import { useRouter } from "next/navigation";

export function ForbiddenErrorView() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="forbidden-view">
      <div className="forbidden-card">
        <div className="forbidden-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="forbidden-content">
          <h1>Access Denied</h1>
          <p>
            You don't have permission to view or edit this document. 
            It might be private, or you might be logged in with a different account.
          </p>
          <div className="forbidden-actions">
            <button
              className="auth-submit"
              type="button"
              onClick={handleGoBack}
            >
              Back to Dashboard
            </button>
            <button
              className="auth-secondary"
              type="button"
              onClick={() => router.push("/")}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
