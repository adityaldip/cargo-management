import { FeedCreateButton } from "@/components/feed-create-button";
import { FeedPostCard } from "@/components/feed-post-card";
import { FeedSearchForm } from "@/components/feed-search-form";
import { FeedWorkspaceShell } from "@/components/feed-workspace-shell";
import type { FeedPostListItem } from "@/lib/feed-posts";

export function FeedPostsPage({
  posts,
  search,
}: {
  posts: FeedPostListItem[];
  search: string;
}) {
  return (
    <FeedWorkspaceShell
      title="Team posts, comments, reactions, and hashtags"
      subtitle="Use the shared workspace feed to publish updates, search by keyword or hashtag, and keep the activity timeline visible on the right."
      actions={<FeedCreateButton />}
    >
      <div className="space-y-4">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <FeedSearchForm initialSearch={search} />
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No posts found yet.
          </div>
        ) : (
          posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
            />
          ))
        )}
      </div>
    </FeedWorkspaceShell>
  );
}
