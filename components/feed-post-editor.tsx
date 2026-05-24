"use client";

import { useEffect, useState } from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Toolbar,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";

import { Input } from "@/components/ui/input";

export function FeedPostEditor({
  feedPostId,
  initialTitle,
  initialBodyText,
}: {
  feedPostId: string;
  initialTitle: string;
  initialBodyText: string;
}) {
  const [title, setTitle] = useState(
    initialTitle
  );
  const liveblocks = useLiveblocksExtension({
    field: `feed-post-content:${feedPostId}`,
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      liveblocks,
    ],
    content: initialBodyText
      ? {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: initialBodyText,
                },
              ],
            },
          ],
        }
      : undefined,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-3xl border border-gray-200 bg-white px-5 py-4 text-base leading-7 text-gray-800 outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    let timeoutId = 0;

    const persistSnapshot = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void fetch(`/api/feeds/${feedPostId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            bodyPlainText:
              editor.getText(),
          }),
        });
      }, 600);
    };

    persistSnapshot();
    editor.on("update", persistSnapshot);

    return () => {
      editor.off("update", persistSnapshot);
      window.clearTimeout(timeoutId);
    };
  }, [editor, feedPostId, title]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        void fetch(`/api/feeds/${feedPostId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            bodyPlainText:
              editor.getText(),
          }),
        });
      },
      600
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editor, feedPostId, title]);

  return (
    <section className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
          Collaborative post
        </p>
        <Input
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          className="h-14 rounded-2xl border-gray-200 text-2xl font-semibold"
          placeholder="Untitled post"
        />
      </div>

      <Toolbar
        editor={editor}
        className="rounded-2xl border border-gray-200 bg-gray-50"
      />

      <EditorContent editor={editor} />
    </section>
  );
}
