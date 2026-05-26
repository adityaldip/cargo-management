import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { listPocStreamActivity } from "@/lib/poc-stream-activity";
import { isPocTeamStreamEnabled } from "@/lib/poc-team-stream";

export async function GET(
  _request: NextRequest
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

  try {
    const activities =
      await listPocStreamActivity(
        currentUser.id
      );

    return NextResponse.json({ activities });
  } catch (error) {
    console.error(
      "Unable to list POC stream activity.",
      error
    );

    return NextResponse.json(
      { error: "Unable to load stream activity." },
      { status: 500 }
    );
  }
}
