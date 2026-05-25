import { NextRequest, NextResponse } from "next/server";

import { createFeedPost, listFeedPosts } from "@/lib/feed-posts";
import { getCurrentAppUser } from "@/lib/app-auth";
import {
  notifyWorkspaceActivity,
  truncateActivityTitle,
} from "@/lib/workspace-activity";

export async function GET(
  request: NextRequest
) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(
    request.url
  );
  const search =
    searchParams.get("search") ?? "";
  const limit = Number(
    searchParams.get("limit") ?? "20"
  );
  const offset = Number(
    searchParams.get("offset") ?? "0"
  );

  const result = await listFeedPosts(
    currentUser.id,
    {
      search,
      limit: Number.isFinite(limit)
        ? limit
        : 20,
      offset: Number.isFinite(offset)
        ? offset
        : 0,
    }
  );

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest
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
  const title = body?.title?.trim() ?? "";
  const bodyPlainText =
    body?.bodyPlainText?.trim() ?? "";
  const isPublished =
    body?.isPublished !== false;

  if (
    isPublished &&
    !title &&
    !bodyPlainText
  ) {
    return NextResponse.json(
      {
        error: "Title or content is required.",
      },
      { status: 400 }
    );
  }

  const post = await createFeedPost({
    authorUserId: currentUser.id,
    title,
    bodyPlainText,
    isPublished,
  });

  if (isPublished) {
    try {
      await notifyWorkspaceActivity({
        subjectId: post.id,
        activity: {
          type: "feed-post",
          actorName: currentUser.name,
          title: truncateActivityTitle(
            title || "New post"
          ),
          description: bodyPlainText,
        },
      });
    } catch (notificationError) {
      console.error(
        "Unable to send feed post activity notification.",
        notificationError
      );
    }
  }

  return NextResponse.json({
    post,
  });
}
