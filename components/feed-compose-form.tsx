"use client";

import dynamic from "next/dynamic";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logFeedComposeEditor } from "@/lib/feed-compose-editor-debug";

const FeedComposeEditor = dynamic(
  () =>
    import("@/components/feed-compose-editor").then(
      (module) => {
        logFeedComposeEditor("dynamic import resolved");
        return module.FeedComposeEditor;
      }
    ),
  {
    ssr: false,
    loading: () => {
      logFeedComposeEditor("dynamic loading placeholder");
      return (
        <div className="feed-compose-editor flex min-h-[320px] items-center justify-center text-sm text-gray-500">
          Loading editor...
        </div>
      );
    },
  }
);

export function FeedComposeForm() {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isEditorReady, setIsEditorReady] =
    useState(false);

  const handleEditorReady = useCallback(
    (editor: Editor) => {
      logFeedComposeEditor("form handleEditorReady", {
        isDestroyed: editor.isDestroyed,
        isInitialized: editor.isInitialized,
      });
      editorRef.current = editor;
      setIsEditorReady(true);
    },
    []
  );

  useEffect(() => {
    logFeedComposeEditor("form mount");
  }, []);

  useEffect(() => {
    logFeedComposeEditor("form isEditorReady", {
      isEditorReady,
      hasEditorRef: Boolean(editorRef.current),
    });
  }, [isEditorReady]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const editor = editorRef.current;

    if (!editor) {
      setError(
        "The editor is still loading."
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          bodyPlainText: editor.getText(),
          isPublished: true,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to create post."
        );
        setIsSubmitting(false);
        return;
      }

      const postId = result.post?.id;

      if (!postId) {
        setError("Unable to create post.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/feeds/${postId}`);
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
        <FeedComposeEditor
          onEditorReady={handleEditorReady}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isBusy || !isEditorReady}
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
