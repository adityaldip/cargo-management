"use client";

import { useCallback } from "react";
import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react";

import { dispatchFeedInboxRefresh } from "@/lib/feed-activity-refresh";

export function FeedPostComments({
  feedPostId,
}: {
  feedPostId: string;
  postTitle?: string;
}) {
  const { threads, isLoading } =
    useThreads({
      query: {
        resolved: false,
        metadata: {
          feedPostId,
        },
      },
    });

  const handleCommentSubmit = useCallback(() => {
    dispatchFeedInboxRefresh();
  }, []);

  return (
    <section className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Comments
        </h2>
        <p className="text-sm text-gray-500">
          Mention teammates with @ and react to replies with emoji.
          Thread notifications are sent automatically.
        </p>
      </div>

      <Composer
        metadata={{
          feedPostId,
        }}
        onComposerSubmit={handleCommentSubmit}
      />

      {isLoading ? (
        <div className="text-sm text-gray-500">
          Loading comments...
        </div>
      ) : threads?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
          No comments yet. Start the conversation.
        </div>
      ) : (
        <div className="space-y-4">
          {threads?.map((thread) => (
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
    </section>
  );
}
