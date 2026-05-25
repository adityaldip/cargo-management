import { FeedNewPostPage } from "@/components/feed-new-post-page";
import { getCurrentAppUser } from "@/lib/app-auth";

export default async function NewFeedPostPage() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return <FeedNewPostPage />;
}
