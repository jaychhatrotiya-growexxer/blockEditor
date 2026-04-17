"use client";

import { useEffect, useState } from "react";

export function AuthForm({
  mode,
  submitLabel,
  onSubmit,
  errorMessage,
  disabled,
}) {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isRegister = mode === "register";

  if (!isMounted) {
    return (
      <div className="auth-form-placeholder" style={{ minHeight: "260px" }}>
        <div className="skeleton skeleton-block" style={{ height: "60px", marginBottom: "20px" }} />
        <div className="skeleton skeleton-block" style={{ height: "60px", marginBottom: "30px" }} />
        <div className="skeleton skeleton-btn" style={{ width: "100%", height: "48px" }} />
      </div>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field" suppressHydrationWarning>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
          disabled={disabled || isSubmitting}
        />
      </div>

      <div className="auth-field" suppressHydrationWarning>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={values.password}
          onChange={handleChange}
          placeholder={
            isRegister
              ? "At least 8 characters and 1 number"
              : "Enter your password"
          }
          required
          disabled={disabled || isSubmitting}
        />
        {isRegister ? (
          <p className="auth-hint">
            Use at least 8 characters and include at least 1 number.
          </p>
        ) : null}
      </div>

      {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

      <button
        className="auth-submit"
        type="submit"
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}
