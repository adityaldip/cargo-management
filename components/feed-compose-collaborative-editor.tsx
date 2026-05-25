"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/core";

import { FeedCollaborativeEditorCore } from "@/components/feed-collaborative-editor-core";
import { FeedCollaborativeEditorGate } from "@/components/feed-collaborative-editor-gate";
import { COMPOSE_EDITOR_DEFAULT_HTML } from "@/lib/feed-room";

export function FeedComposeCollaborativeEditor({
  draftId,
  onEditorReady,
}: {
  draftId: string;
  onEditorReady: (editor: Editor) => void;
}) {
  const handleEditorReady = useCallback(
    (editor: Editor) => {
      onEditorReady(editor);
    },
    [onEditorReady]
  );

  return (
    <FeedCollaborativeEditorGate>
      <FeedCollaborativeEditorCore
        key={draftId}
        initialContent={COMPOSE_EDITOR_DEFAULT_HTML}
        onEditorReady={handleEditorReady}
      />
    </FeedCollaborativeEditorGate>
  );
}
