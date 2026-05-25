import type { FeedPostListItem } from "@/lib/feed-posts";

export function FeedPostView({
  post,
}: {
  post: FeedPostListItem;
}) {
  return (
    <article className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">
          {post.author?.name ?? "Unknown author"}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          {post.title}
        </h2>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
          {new Date(post.updated_at).toLocaleString()}
        </p>
      </div>

      <div className="whitespace-pre-wrap text-base leading-7 text-gray-800">
        {post.body_plain_text?.trim() || "No content."}
      </div>
    </article>
  );
}
