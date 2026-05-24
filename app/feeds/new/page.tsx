import { FeedComposeForm } from "@/components/feed-compose-form";
import { FeedWorkspaceShell } from "@/components/feed-workspace-shell";
import { getCurrentAppUser } from "@/lib/app-auth";
import { createFeedPost } from "@/lib/feed-posts";

export default async function NewFeedPostPage() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const draft = await createFeedPost({
    authorUserId: currentUser.id,
    title: "",
    bodyPlainText: "",
    isPublished: false,
  });

  return (
    <FeedWorkspaceShell
      title="Create a post"
      subtitle="Draft the title and message first, then create the post. After that you can keep editing collaboratively and use comments, mentions, and reactions."
    >
      <FeedComposeForm draftId={draft.id} />
    </FeedWorkspaceShell>
  );
}
