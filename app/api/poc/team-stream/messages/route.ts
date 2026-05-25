import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import {
  createPocTeamStreamMessage,
  isPocStreamRoomId,
  isPocTeamStreamEnabled,
  listPocTeamStreamMessages,
} from "@/lib/poc-team-stream";
import { POC_TEAM_STREAM_ROOM_ID } from "@/lib/poc-team-stream-constants";

function resolveRoomId(
  value: string | null
) {
  const roomId =
    value?.trim() || POC_TEAM_STREAM_ROOM_ID;

  if (!isPocStreamRoomId(roomId)) {
    return null;
  }

  return roomId;
}

export async function GET(
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

  const roomId = resolveRoomId(
    request.nextUrl.searchParams.get("roomId")
  );

  if (!roomId) {
    return NextResponse.json(
      { error: "Invalid room id." },
      { status: 400 }
    );
  }

  try {
    const messages =
      await listPocTeamStreamMessages(roomId);

    return NextResponse.json({ messages, roomId });
  } catch (error) {
    console.error(
      "Unable to list POC team stream messages.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load team stream messages.",
      },
      { status: 500 }
    );
  }
}

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

  const body = await request.json();
  const text =
    typeof body?.text === "string"
      ? body.text.trim()
      : "";
  const roomId = resolveRoomId(
    typeof body?.roomId === "string"
      ? body.roomId
      : null
  );
  const mentionedUserIds = Array.isArray(
    body?.mentionedUserIds
  )
    ? body.mentionedUserIds.filter(
        (id: unknown): id is string =>
          typeof id === "string"
      )
    : [];

  if (!roomId) {
    return NextResponse.json(
      { error: "Invalid room id." },
      { status: 400 }
    );
  }

  if (!text) {
    return NextResponse.json(
      { error: "Message text is required." },
      { status: 400 }
    );
  }

  try {
    const message =
      await createPocTeamStreamMessage({
        roomId,
        authorUserId: currentUser.id,
        authorName: currentUser.name,
        text,
        mentionedUserIds,
      });

    return NextResponse.json({ message, roomId });
  } catch (error) {
    console.error(
      "Unable to create POC team stream message.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send team stream message.",
      },
      { status: 500 }
    );
  }
}
