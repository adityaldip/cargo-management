import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import {
  createPocStreamRoom,
  isPocTeamStreamEnabled,
  listPocStreamRooms,
} from "@/lib/poc-team-stream";

export async function GET() {
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

  try {
    const rooms = await listPocStreamRooms();

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error(
      "Unable to list POC stream rooms.",
      error
    );

    return NextResponse.json(
      { error: "Unable to load stream rooms." },
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
  const title =
    typeof body?.title === "string"
      ? body.title.trim()
      : typeof body?.name === "string"
        ? body.name.trim()
        : "";
  const description =
    typeof body?.description === "string"
      ? body.description.trim()
      : "";

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    );
  }

  try {
    const room = await createPocStreamRoom({
      title,
      description,
    });

    return NextResponse.json({ room });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Title is required." ||
        error.message === "Room name is required.")
    ) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    console.error(
      "Unable to create POC stream room.",
      error
    );

    return NextResponse.json(
      { error: "Unable to create stream room." },
      { status: 500 }
    );
  }
}
