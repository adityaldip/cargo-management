import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { notifyWorkspaceActivity } from "@/lib/workspace-activity";

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  await notifyWorkspaceActivity({
    subjectId: body.subjectId,
    activity: {
      title: body.title,
      description: body.description,
      type: body.type,
      actorName: user.name,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
