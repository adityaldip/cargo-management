"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";

import { FeedCollaborativeEditorCore } from "@/components/feed-collaborative-editor-core";
import { FeedCollaborativeEditorGate } from "@/components/feed-collaborative-editor-gate";
import { plainTextToInitialContent } from "@/lib/feed-editor-content";
import type { FeedPostListItem } from "@/lib/feed-posts";

const SAVE_DEBOUNCE_MS = 1500;

export function FeedCollaborativeEditor({
  post,
}: {
  post: FeedPostListItem;
}) {
  return (
    <FeedCollaborativeEditorGate>
      <FeedCollaborativeEditorDetail
        key={post.id}
        post={post}
      />
    </FeedCollaborativeEditorGate>
  );
}

function FeedCollaborativeEditorDetail({
  post,
}: {
  post: FeedPostListItem;
}) {
  const saveTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const initialContent = useMemo(
    () =>
      plainTextToInitialContent(
        post.body_plain_text ?? ""
      ),
    [post.body_plain_text]
  );

  const persistSnapshot = useCallback(
    async (editor: Editor) => {
      setSaveState("saving");

      try {
        const response = await fetch(
          `/api/feeds/${post.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: post.title,
              bodyPlainText: editor.getText(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Save failed");
        }

        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [post.id, post.title]
  );

  const handleUpdate = useCallback(
    (editor: Editor) => {
      setSaveState("idle");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        void persistSnapshot(editor);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistSnapshot]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <article className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">
          {post.author?.name ?? "Unknown author"}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          {post.title}
        </h2>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
          {new Date(post.updated_at).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">
          Collaborative editing — changes sync live and
          save to the feed every few seconds.
        </p>
      </div>

      <FeedCollaborativeEditorCore
        initialContent={initialContent}
        onUpdate={handleUpdate}
      />

      <p className="text-xs text-gray-500">
        {saveState === "saving" && "Saving snapshot…"}
        {saveState === "saved" && "Saved to feed list."}
        {saveState === "error" &&
          "Could not save snapshot. Will retry on next edit."}
        {saveState === "idle" && "Edits auto-save."}
      </p>
    </article>
  );
}
