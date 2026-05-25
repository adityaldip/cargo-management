import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { FEED_POST_EMOJIS } from "@/lib/feed-constants";
import {
  getFeedPostAuthorUserId,
  getFeedPostTitle,
  toggleFeedReaction,
} from "@/lib/feed-posts";
import {
  notifyWorkspaceActivity,
  truncateActivityTitle,
} from "@/lib/workspace-activity";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const emoji = body?.emoji;

  if (
    typeof emoji !== "string" ||
    !FEED_POST_EMOJIS.includes(
      emoji as (typeof FEED_POST_EMOJIS)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Invalid emoji." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const result = await toggleFeedReaction({
    feedPostId: id,
    userId: currentUser.id,
    emoji,
  });

  if (result.added) {
    try {
      const [postTitle, postAuthorUserId] =
        await Promise.all([
          getFeedPostTitle(id),
          getFeedPostAuthorUserId(id),
        ]);
      const displayTitle =
        truncateActivityTitle(postTitle);

      await notifyWorkspaceActivity({
        subjectId: id,
        actorUserId: currentUser.id,
        postAuthorUserId,
        activity: {
          type: "feed-reaction",
          actorName: currentUser.name,
          title: displayTitle,
          description: `${currentUser.name} reacted ${emoji} on "${displayTitle}"`,
          emoji,
        },
      });
    } catch (notificationError) {
      console.error(
        "Unable to send feed reaction activity notification.",
        notificationError
      );
    }
  }

  return NextResponse.json(result);
}
