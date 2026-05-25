"use client";

import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const DEFAULT_CONTENT =
  "<p>Write your post here. You can add hashtags and format the message before publishing.</p>";

export function FeedComposeEditor({
  onEditorReady,
}: {
  onEditorReady: (editor: Editor) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onEditorReadyRef = useRef(onEditorReady);

  onEditorReadyRef.current = onEditorReady;

  useEffect(() => {
    const mountElement = mountRef.current;

    if (!mountElement) {
      return;
    }

    const editor = new Editor({
      element: mountElement,
      extensions: [StarterKit],
      content: DEFAULT_CONTENT,
      autofocus: "end",
      injectCSS: true,
      editorProps: {
        attributes: {
          class: "feed-compose-editor__prosemirror",
        },
      },
      onCreate: ({ editor: createdEditor }) => {
        onEditorReadyRef.current(createdEditor);
      },
    });

    return () => {
      editor.destroy();
    };
  }, []);

  return (
    <div className="feed-compose-editor">
      <div
        ref={mountRef}
        className="feed-compose-editor__mount"
      />
    </div>
  );
}
