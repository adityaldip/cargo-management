"use client";

import { FeedPostComments } from "@/components/feed-post-comments";
import { FeedPostEditor } from "@/components/feed-post-editor";
import { FeedPostReactions } from "@/components/feed-post-reactions";
import type { FeedPostListItem } from "@/lib/feed-posts";

export function FeedPostRoom({
  post,
}: {
  post: FeedPostListItem;
}) {
  return (
    <div className="space-y-6">
      <FeedPostEditor
        feedPostId={post.id}
        initialTitle={post.title}
        initialBodyText={post.body_plain_text}
      />

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

      <FeedPostComments
        feedPostId={post.id}
        postTitle={post.title}
      />
    </div>
  );
}
