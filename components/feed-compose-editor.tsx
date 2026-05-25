"use client";

import { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { logFeedComposeEditor } from "@/lib/feed-compose-editor-debug";

const extensions = [StarterKit];

const DEFAULT_CONTENT =
  "<p>Write your post here. You can add hashtags and format the message before publishing.</p>";

function safeDescribeEditor(editor: Editor | null) {
  if (!editor) {
    return { hasEditor: false };
  }

  const base = {
    hasEditor: true,
    isDestroyed: editor.isDestroyed,
    isInitialized: editor.isInitialized,
    isEditable: editor.isEditable,
  };

  try {
    const viewDom = editor.view.dom;

    return {
      ...base,
      hasView: true,
      viewDomClass: viewDom.className,
      viewDomInDocument: document.contains(viewDom),
      offsetHeight: viewDom.offsetHeight,
      textLength: editor.getText().length,
    };
  } catch (error) {
    return {
      ...base,
      hasView: false,
      viewError:
        error instanceof Error
          ? error.message
          : "view unavailable",
    };
  }
}

export function FeedComposeEditor({
  onEditorReady,
}: {
  onEditorReady: (editor: Editor) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onEditorReadyRef = useRef(onEditorReady);
  const [isReady, setIsReady] = useState(false);

  onEditorReadyRef.current = onEditorReady;

  useEffect(() => {
    const mountElement = mountRef.current;

    if (!mountElement) {
      logFeedComposeEditor("mount element missing");
      return;
    }

    logFeedComposeEditor("creating editor on mount element");

    const editor = new Editor({
      element: mountElement,
      extensions,
      content: DEFAULT_CONTENT,
      autofocus: "end",
      injectCSS: true,
      editorProps: {
        attributes: {
          class: "feed-compose-editor__prosemirror",
        },
      },
      onCreate: ({ editor: createdEditor }) => {
        logFeedComposeEditor(
          "onCreate",
          safeDescribeEditor(createdEditor)
        );
        onEditorReadyRef.current(createdEditor);
        setIsReady(true);
      },
      onDestroy: () => {
        logFeedComposeEditor("onDestroy");
        setIsReady(false);
      },
    });

    logFeedComposeEditor(
      "editor constructed",
      safeDescribeEditor(editor)
    );

    const frameId = window.requestAnimationFrame(() => {
      logFeedComposeEditor(
        "post-paint",
        safeDescribeEditor(editor)
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      logFeedComposeEditor("cleanup destroy");
      editor.destroy();
    };
  }, []);

  return (
    <div className="feed-compose-editor">
      <div
        ref={mountRef}
        className="feed-compose-editor__mount"
      />
      {!isReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-500">
          Loading editor...
        </div>
      )}
    </div>
  );
}
