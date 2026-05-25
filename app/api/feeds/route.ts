import { NextRequest, NextResponse } from "next/server";

import { createFeedPost, listFeedPosts } from "@/lib/feed-posts";
import { getCurrentAppUser } from "@/lib/app-auth";
import { isValidFeedPostId } from "@/lib/feed-room";
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
  const requestedId =
    typeof body?.id === "string"
      ? body.id.trim()
      : undefined;
  const title = body?.title?.trim() ?? "";
  const bodyPlainText =
    body?.bodyPlainText?.trim() ?? "";
  const isPublished =
    body?.isPublished !== false;

  if (
    requestedId &&
    !isValidFeedPostId(requestedId)
  ) {
    return NextResponse.json(
      { error: "Invalid post id." },
      { status: 400 }
    );
  }

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

  let post;

  try {
    post = await createFeedPost({
      id: requestedId,
      authorUserId: currentUser.id,
      title,
      bodyPlainText,
      isPublished,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Post id already exists."
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Invalid post id."
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    throw error;
  }

  if (isPublished) {
    try {
      await notifyWorkspaceActivity({
        subjectId: post.id,
        actorUserId: currentUser.id,
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
