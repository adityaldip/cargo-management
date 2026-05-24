import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  const lb = await liveblocks.triggerInboxNotification({
    userId: "user-1",
    roomId: "mail-processing-room",
    kind: "$custom",
    subjectId: body.subjectId,
    activityData: {
      title: body.title,
      description: body.description,
      type: body.type,
    },
  });
  console.log("test post", lb)

  return NextResponse.json({
    success: true,
  });
}   