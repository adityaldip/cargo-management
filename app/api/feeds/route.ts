import { NextRequest, NextResponse } from "next/server";

import { createFeedPost, listFeedPosts } from "@/lib/feed-posts";
import { getCurrentAppUser } from "@/lib/app-auth";

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

  const posts = await listFeedPosts(
    currentUser.id,
    search
  );

  return NextResponse.json({
    posts,
  });
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

  return NextResponse.json({
    post,
  });
}
