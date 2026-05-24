import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import {
  toggleFeedReaction,
} from "@/lib/feed-posts";
import { FEED_POST_EMOJIS } from "@/lib/feed-constants";

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

  return NextResponse.json(result);
}
