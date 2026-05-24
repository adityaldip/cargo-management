import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";
import { supabaseAdmin } from "@/lib/supabase";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { data: appUsers, error } =
    await supabaseAdmin
      .from("app_users")
      .select("id");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  await Promise.all(
    (appUsers ?? []).map((appUser) =>
      liveblocks.triggerInboxNotification({
        userId: appUser.id,
        roomId: LIVEBLOCKS_ROOM_ID,
        kind: "$custom",
        subjectId: body.subjectId,
        activityData: {
          title: body.title,
          description: body.description,
          type: body.type,
          actorName: user.name,
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
  });
}
