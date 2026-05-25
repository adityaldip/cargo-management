import { FeedComposeForm } from "@/components/feed-compose-form";
import { FeedLightShell } from "@/components/feed-light-shell";
import { getCurrentAppUser } from "@/lib/app-auth";

export default async function NewFeedPostPage() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return (
    <FeedLightShell
      title="Create a post"
      subtitle="Draft the title and message, then publish. On the post page you can react and comment."
    >
      <FeedComposeForm />
    </FeedLightShell>
  );
}
