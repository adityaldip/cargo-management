"use client";

import { useCallback } from "react";
import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react";
import { useTriggerActivityNotification } from "@/hooks/use-trigger-activity-notification";
import { appUsersOperations } from '@/lib/supabase-operations'

export function FeedPostComments({
  feedPostId,
  postTitle,
}: {
  feedPostId: string;
  postTitle: string;
}) {
  const notifyActivity =
    useTriggerActivityNotification();
  const { threads, isLoading } =
    useThreads({
      query: {
        resolved: false,
        metadata: {
          feedPostId,
        },
      },
    });

    const handleCommentSubmit = useCallback(
      async ({ body }: any) => {
        try {
          const mentionIds =
            body?.content
              ?.flatMap(
                (node: any) => node.children || []
              )
              ?.filter(
                (child: any) =>
                  child.type === "mention" &&
                  child.kind === "user"
              )
              ?.map((child: any) => child.id) || [];
    
              const { data: users, error } =
              await appUsersOperations.getByIds(
                mentionIds
              );

              const usersMap = Object.fromEntries(
              (Array.isArray(users) ? users : []).map(
                (user) => [user.id, user.name]
              )
          );

          const commentText =
            body?.content
              ?.flatMap(
                (node: any) => node.children || []
              )
              ?.map((child: any) => {
                if (child.text) {
                  return child.text;
                }
    
                if (
                  child.type === "mention" &&
                  child.kind === "user"
                ) {
                  return `@${
                    usersMap[child.id] ||
                    child.id
                  }`;
                }
    
                return "";
              })
              ?.join("")
              ?.trim() || "New comment";
    
          await notifyActivity({
            title: "Feed Comment Added",
            description: commentText,
            type: "feed-comment",
            subjectId: feedPostId,
          });
        } catch (error) {
          console.error(error);
        }
      },
      [feedPostId, notifyActivity]
    );

  return (
    <section className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Comments
        </h2>
        <p className="text-sm text-gray-500">
          Mention teammates with @ and react to replies with emoji.
        </p>
      </div>

      <Composer
        metadata={{
          feedPostId,
        }}
        onComposerSubmit={
          handleCommentSubmit
        }
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
