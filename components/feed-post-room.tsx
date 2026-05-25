"use client";

import dynamic from "next/dynamic";

import { FeedPostReactions } from "@/components/feed-post-reactions";
import { FeedPostView } from "@/components/feed-post-view";
import type { FeedPostListItem } from "@/lib/feed-posts";

const LazyFeedPostComments = dynamic(
  () =>
    import("@/components/feed-post-comments").then(
      (module) => ({
        default: module.FeedPostComments,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-3xl border bg-white p-5 text-sm text-gray-500 shadow-sm">
        Loading comments...
      </section>
    ),
  }
);

export function FeedPostRoom({
  post,
}: {
  post: FeedPostListItem;
}) {
  return (
    <div className="space-y-6">
      <FeedPostView post={post} />

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {post.hashtags.map((hashtag) => (
            <span
              key={hashtag}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              #{hashtag}
            </span>
          ))}
        </div>

        <FeedPostReactions
          feedPostId={post.id}
          initialCounts={post.reactions}
          initialSelected={post.currentUserReactions}
        />
      </section>

      <LazyFeedPostComments
        feedPostId={post.id}
        postTitle={post.title}
      />
    </div>
  );
}
