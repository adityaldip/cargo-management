import { notFound } from "next/navigation";

import { FeedPostRoom } from "@/components/feed-post-room";
import { FeedWorkspaceShell } from "@/components/feed-workspace-shell";
import { getCurrentAppUser } from "@/lib/app-auth";
import { getFeedPost } from "@/lib/feed-posts";

export default async function FeedPostPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const { id } = await params;
  const post = await getFeedPost(
    id,
    currentUser.id
  );

  if (!post) {
    notFound();
  }

  return (
    <FeedWorkspaceShell
      title={post.title}
      subtitle={`${post.author?.name ?? "Unknown author"} · ${new Date(post.updated_at).toLocaleString()}`}
    >
      <FeedPostRoom post={post} />
    </FeedWorkspaceShell>
  );
}
