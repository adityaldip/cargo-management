"use client";

import { useCallback, useState } from "react";
import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { dispatchPocStreamActivityRefresh } from "@/lib/poc-stream-activity-refresh";

export function PocStreamMessageComments({
  streamMessageId,
}: {
  streamMessageId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { threads, isLoading } =
    useThreads({
      query: {
        resolved: false,
        metadata: {
          streamMessageId,
        },
      },
    });

  const commentCount = threads?.reduce(
    (total, thread) =>
      total + (thread.comments?.length ?? 0),
    0
  ) ?? 0;

  const handleCommentSubmit = useCallback(() => {
    setIsOpen(true);
    dispatchPocStreamActivityRefresh();
  }, []);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span>
          Comments
          {commentCount > 0
            ? ` (${commentCount})`
            : ""}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-500">
            Comments use Liveblocks Threads (not
            feed messages). @mentions work here.
          </p>

          <Composer
            metadata={{
              streamMessageId,
            }}
            onComposerSubmit={
              handleCommentSubmit
            }
          />

          {isLoading ? (
            <p className="text-sm text-gray-500">
              Loading comments...
            </p>
          ) : threads?.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
              No comments yet. Reply below.
            </p>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <Thread
                  key={thread.id}
                  thread={thread}
                  onComposerSubmit={
                    handleCommentSubmit
                  }
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
