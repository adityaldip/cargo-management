"use client";

import { useState } from "react";

import { FeedComposeForm } from "@/components/feed-compose-form";
import { FeedComposeShell } from "@/components/feed-compose-shell";
import { buildFeedRoomId } from "@/lib/feed-room";

export function FeedNewPostPage() {
  const [draftId] = useState(() => crypto.randomUUID());

  return (
    <FeedComposeShell
      title="Create a post"
      subtitle="Draft with the collaborative editor. When you publish, the same room continues on the post page for comments and reactions."
      collaborationRoomId={buildFeedRoomId(draftId)}
    >
      <FeedComposeForm draftId={draftId} />
    </FeedComposeShell>
  );
}
