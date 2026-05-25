import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

import { createFeedPost, listFeedPosts } from "@/lib/feed-posts";
import { getCurrentAppUser } from "@/lib/app-auth";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";
import { supabaseAdmin } from "@/lib/supabase";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

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
      const { data: appUsers } =
        await supabaseAdmin
          .from("app_users")
          .select("id");

      await Promise.all(
        (appUsers ?? []).map((appUser) =>
          liveblocks.triggerInboxNotification({
            userId: appUser.id,
            roomId: LIVEBLOCKS_ROOM_ID,
            kind: "$custom",
            subjectId: post.id,
            activityData: {
              title: title || "New post",
              description: bodyPlainText,
              type: "feed-post",
              actorName: currentUser.name,
            },
          })
        )
      );
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
