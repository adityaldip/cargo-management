import Link from "next/link";

import type { FeedPostListItem } from "@/lib/feed-posts";
import { FeedPostReactions } from "@/components/feed-post-reactions";

export function FeedPostCard({
  post,
}: {
  post: FeedPostListItem;
}) {
  return (
    <article className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {post.author?.name ?? "Unknown author"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">
            <Link href={`/feeds/${post.id}`}>
              {post.title}
            </Link>
          </h2>
        </div>

        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
          {new Date(post.updated_at).toLocaleDateString()}
        </p>
      </div>

      <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
        {post.body_preview || "No content yet."}
      </p>

      {post.hashtags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.hashtags.map((hashtag) => (
            <Link
              key={hashtag}
              href={`/feeds?search=%23${encodeURIComponent(hashtag)}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              #{hashtag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
        <FeedPostReactions
          feedPostId={post.id}
          initialCounts={post.reactions}
          initialSelected={post.currentUserReactions}
        />

        <Link
          href={`/feeds/${post.id}`}
          className="text-sm font-medium text-gray-600 hover:text-black"
        >
          Open post
        </Link>
      </div>
    </article>
  );
}
