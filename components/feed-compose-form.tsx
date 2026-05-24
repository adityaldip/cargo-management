"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Editor,
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Toolbar,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTriggerActivityNotification } from "@/hooks/use-trigger-activity-notification";

function FeedDraftEditor({
  draftId,
  onEditorChange,
}: {
  draftId: string;
  onEditorChange: (editor: Editor | null) => void;
}) {
  const liveblocks = useLiveblocksExtension({
    field: `feed-post-content:${draftId}`,
    initialContent:
      "<p>Write your post here. You can mention teammates, add hashtags, and format the message before publishing it.</p>",
  });
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      liveblocks,
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-3xl border border-gray-200 bg-white px-5 py-4 text-base leading-7 text-gray-800 outline-none",
      },
    },
  });

  useEffect(() => {
    onEditorChange(editor);

    return () => {
      onEditorChange(null);
    };
  }, [editor, onEditorChange]);

  return (
    <>
      <Toolbar
        editor={editor}
        className="rounded-2xl border border-gray-200 bg-gray-50"
      />
      <EditorContent editor={editor} />
    </>
  );
}

export function FeedComposeForm({
  draftId,
}: {
  draftId: string;
}) {
  const router = useRouter();
  const notifyActivity =
    useTriggerActivityNotification();
  const [title, setTitle] = useState("");
  const [error, setError] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [editor, setEditor] =
    useState<Editor | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editor) {
      setError(
        "The collaborative draft is still loading."
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/feeds/${draftId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            bodyPlainText:
              editor.getText(),
            isPublished: true,
          }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to create post."
        );
        setIsSubmitting(false);
        return;
      }

      try {
        await notifyActivity({
          title: title.trim(),
          description: editor.getText(),
          type: "feed-post",
          subjectId: draftId,
        });
      } catch (notificationError) {
        console.error(
          "Unable to refresh activity feed after creating post.",
          notificationError
        );
      }

      router.push(`/feeds/${draftId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create post."
      );
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="feed-title"
          className="text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <Input
          id="feed-title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="What do you want to share?"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Post
        </label>
        <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
          <FeedDraftEditor
            draftId={draftId}
            onEditorChange={setEditor}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isBusy || !draftId}
        >
          {isSubmitting
            ? "Creating..."
            : "Create post"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/feeds")}
          disabled={isBusy}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
