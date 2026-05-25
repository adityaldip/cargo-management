import { FeedCreateButton } from "@/components/feed-create-button";
import { FeedPostsLoadMore } from "@/components/feed-posts-load-more";
import { FeedSearchForm } from "@/components/feed-search-form";
import { FeedLightShell } from "@/components/feed-light-shell";
import type { FeedPostListItem } from "@/lib/feed-posts";

export function FeedPostsPage({
  posts,
  hasMore,
  nextOffset,
  search,
}: {
  posts: FeedPostListItem[];
  hasMore: boolean;
  nextOffset: number;
  search: string;
}) {
  return (
    <FeedLightShell
      title="Team posts, comments, reactions, and hashtags"
      subtitle="Browse published updates, search by keyword or hashtag, and open a post to comment or react."
      actions={<FeedCreateButton />}
    >
      <div className="space-y-4">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <FeedSearchForm initialSearch={search} />
        </div>

        <FeedPostsLoadMore
          initialPosts={posts}
          initialHasMore={hasMore}
          initialNextOffset={nextOffset}
          search={search}
        />
      </div>
    </FeedLightShell>
  );
}
