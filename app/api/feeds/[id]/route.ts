import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import {
  getFeedPost,
  updateFeedPostSnapshot,
} from "@/lib/feed-posts";

export async function GET(
  _request: NextRequest,
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

  const { id } = await context.params;
  const post = await getFeedPost(
    id,
    currentUser.id
  );

  if (!post) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    post,
  });
}

export async function PATCH(
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
  const { id } = await context.params;

  await updateFeedPostSnapshot(id, {
    title: body?.title ?? "",
    bodyPlainText: body?.bodyPlainText ?? "",
    isPublished:
      typeof body?.isPublished ===
      "boolean"
        ? body.isPublished
        : undefined,
  });

  return NextResponse.json({
    success: true,
  });
}
