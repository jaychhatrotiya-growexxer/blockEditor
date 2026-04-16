"use client";

import { useParams } from "next/navigation";
import { EditorShell } from "@/features/editor/editor-shell";

/**
 * Public share page for viewing documents.
 * Accesses documents via a unique share token.
 */
export default function SharePage() {
  const params = useParams();
  const token = params?.token;

  return <EditorShell shareToken={token} />;
}
