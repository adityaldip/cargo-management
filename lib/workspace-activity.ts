import "server-only";

import { Liveblocks } from "@liveblocks/node";

import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";
import { supabaseAdmin } from "@/lib/supabase";

export type WorkspaceActivityPayload = {
  title: string;
  description: string;
  type: string;
  actorName: string;
  emoji?: string;
};

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export function truncateActivityTitle(
  title: string,
  maxLength = 60
) {
  const trimmed =
    title.trim() || "Untitled post";

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}…`;
}

export async function notifyWorkspaceActivity({
  subjectId,
  activity,
}: {
  subjectId: string;
  activity: WorkspaceActivityPayload;
}) {
  const { data: appUsers, error } =
    await supabaseAdmin
      .from("app_users")
      .select("id");

  if (error) {
    throw error;
  }

  await Promise.all(
    (appUsers ?? []).map((appUser) =>
      liveblocks.triggerInboxNotification({
        userId: appUser.id,
        roomId: LIVEBLOCKS_ROOM_ID,
        kind: "$custom",
        subjectId,
        activityData: activity,
      })
    )
  );
}
