import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import {
  isPocStreamRoomId,
  isPocTeamStreamEnabled,
  seedPocTeamStreamMessages,
} from "@/lib/poc-team-stream";
import { POC_TEAM_STREAM_ROOM_ID } from "@/lib/poc-team-stream-constants";

export async function POST(
  request: NextRequest
) {
  if (!isPocTeamStreamEnabled()) {
    return NextResponse.json(
      { error: "Team stream POC is disabled." },
      { status: 404 }
    );
  }

  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const roomId =
    typeof body?.roomId === "string" &&
    isPocStreamRoomId(body.roomId.trim())
      ? body.roomId.trim()
      : POC_TEAM_STREAM_ROOM_ID;

  try {
    const messages =
      await seedPocTeamStreamMessages(
        roomId,
        currentUser.id,
        currentUser.name
      );

    return NextResponse.json({
      count: messages.length,
      messages,
      roomId,
    });
  } catch (error) {
    console.error(
      "Unable to seed POC team stream messages.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to seed team stream messages.",
      },
      { status: 500 }
    );
  }
}
