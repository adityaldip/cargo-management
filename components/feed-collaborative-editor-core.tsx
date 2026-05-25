"use client";

import { useMemo } from "react";
import {
  Toolbar,
  useIsEditorReady,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function FeedCollaborativeEditorCore({
  initialContent,
  onEditorReady,
  onUpdate,
  showToolbar = true,
}: {
  initialContent: string;
  onEditorReady?: (editor: Editor) => void;
  onUpdate?: (editor: Editor) => void;
  showToolbar?: boolean;
}) {
  const isEditorReady = useIsEditorReady();

  const content = useMemo(
    () => initialContent,
    [initialContent]
  );

  const liveblocks = useLiveblocksExtension({
    initialContent: content,
    comments: false,
    mentions: true,
  });

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
    onCreate: ({ editor: createdEditor }) => {
      onEditorReady?.(createdEditor);
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onUpdate?.(updatedEditor);
    },
  });

  const showEditorUi =
    isEditorReady && editor !== null;

  return (
    <div className="space-y-3">
      {showEditorUi && showToolbar ? (
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
    </div>
  );
}
