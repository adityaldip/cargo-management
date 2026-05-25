import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { listFeedActivity } from "@/lib/feed-activity-feed";

export async function GET() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const activities = await listFeedActivity(
      currentUser.id
    );

    return NextResponse.json({
      activities,
    });
  } catch (error) {
    console.error(
      "Unable to load feed activity.",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load activity feed. Check Liveblocks and database configuration.",
      },
      { status: 500 }
    );
  }
}
