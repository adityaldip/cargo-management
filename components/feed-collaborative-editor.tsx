"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStatus } from "@liveblocks/react";
import {
  Toolbar,
  useIsEditorReady,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { FeedCollaborativeEditorLoading } from "@/components/feed-collaborative-editor-loading";
import { plainTextToInitialContent } from "@/lib/feed-editor-content";
import type { FeedPostListItem } from "@/lib/feed-posts";

const SAVE_DEBOUNCE_MS = 1500;

/**
 * Waits for Liveblocks RoomProvider to finish connecting before mounting
 * TipTap. Otherwise useEditor binds to a stale pre-connect room instance on
 * client-side navigation and useIsEditorReady never becomes true.
 */
export function FeedCollaborativeEditor({
  post,
}: {
  post: FeedPostListItem;
}) {
  const roomStatus = useStatus();
  const canMountEditor =
    roomStatus === "connected" ||
    roomStatus === "reconnecting";

  if (!canMountEditor) {
    return (
      <FeedCollaborativeEditorLoading
        status={roomStatus}
      />
    );
  }

  return (
    <FeedCollaborativeEditorCore
      key={post.id}
      post={post}
    />
  );
}

function FeedCollaborativeEditorCore({
  post,
}: {
  post: FeedPostListItem;
}) {
  const isEditorReady = useIsEditorReady();
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

  const liveblocks = useLiveblocksExtension({
    initialContent,
    comments: false,
    mentions: true,
  });

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

  const scheduleSave = useCallback(
    (editor: Editor) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        void persistSnapshot(editor);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistSnapshot]
  );

  const editor = useEditor({
    extensions: [liveblocks, StarterKit],
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: false,
    editorProps: {
      attributes: {
        class: "feed-collaborative-editor__prosemirror",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      setSaveState("idle");
      scheduleSave(updatedEditor);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const showEditorUi =
    isEditorReady && editor !== null;

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

      {showEditorUi ? (
        <Toolbar editor={editor} />
      ) : null}

      <div className="feed-collaborative-editor relative">
        {editor ? (
          <div
            className={
              showEditorUi
                ? undefined
                : "pointer-events-none opacity-0"
            }
            aria-hidden={!showEditorUi}
          >
            <EditorContent editor={editor} />
          </div>
        ) : null}

        {!showEditorUi ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white text-sm text-gray-500">
            Loading document…
          </div>
        ) : null}
      </div>

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
