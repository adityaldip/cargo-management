import { getCurrentAppUser } from "@/lib/app-auth";
import { listFeedPosts } from "@/lib/feed-posts";
import { FeedPostsPage } from "@/components/feed-posts-page";

export default async function FeedsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
  }>;
}) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const params = await searchParams;
  const search = params.search ?? "";
  const posts = await listFeedPosts(
    currentUser.id,
    search
  );

  return (
    <FeedPostsPage
      posts={posts}
      search={search}
    />
  );
}
