"use client";

import { ProtectedPage } from "@/features/auth/protected-page";
import { DocumentsList } from "@/features/documents/documents-list";

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <h1>Welcome back</h1>
      <p>Manage documents, rename them inline, or remove work you no longer need.</p>
      <DocumentsList />
    </ProtectedPage>
  );
}
