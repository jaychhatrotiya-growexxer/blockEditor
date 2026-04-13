"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/features/auth/auth-form";
import { useAuth } from "@/features/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  async function handleSubmit(values) {
    setErrorMessage("");

    try {
      await login(values);
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Unable to log in.");
    }
  }

  return (
    <AuthCard
      eyebrow="Day 1"
      title="Sign in to your workspace"
      description="Use your account to access documents, block editing, and sharing tools."
      footer={
        <p>
          Need an account? <Link href="/register">Create one</Link>
        </p>
      }
    >
      <AuthForm
        mode="login"
        submitLabel="Sign in"
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        disabled={isBootstrapping}
      />
    </AuthCard>
  );
}
