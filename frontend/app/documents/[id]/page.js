"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ProtectedPage } from "@/features/auth/protected-page";
import { EditorShell } from "@/features/editor/editor-shell";

export default function DocumentEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareToken = searchParams?.get("share") || "";

  if (shareToken) {
    return <EditorShell documentId={params?.id} shareToken={shareToken} />;
  }

  return (
    <ProtectedPage variant="editor">
      <EditorShell documentId={params?.id} />
    </ProtectedPage>
  );
}
