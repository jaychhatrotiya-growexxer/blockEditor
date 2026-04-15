"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { useAuth } from "@/features/auth/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isBootstrapping } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  async function handleSubmit(values) {
    setErrorMessage("");

    try {
      await register(values);
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Unable to create account.");
    }
  }

  return (
    <PublicPageShell ctaHref="/login" ctaLabel="Sign in">
      <AuthCard
        eyebrow="New account"
        title="Create your BlockNote account"
        description="Passwords must be at least 8 characters and include at least one number."
        footer={
          <p>
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        }
      >
        <AuthForm
          mode="register"
          submitLabel="Create account"
          onSubmit={handleSubmit}
          errorMessage={errorMessage}
          disabled={isBootstrapping}
        />
      </AuthCard>
    </PublicPageShell>
  );
}
