"use client";

import { useParams } from "next/navigation";
import { ProtectedPage } from "@/features/auth/protected-page";
import { EditorShell } from "@/features/editor/editor-shell";

export default function DocumentEditorPage() {
  const params = useParams();

  return (
    <ProtectedPage variant="editor">
      <EditorShell documentId={params?.id} />
    </ProtectedPage>
  );
}
