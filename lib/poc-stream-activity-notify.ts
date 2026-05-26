import "server-only";

import { Liveblocks } from "@liveblocks/node";

import { supabaseAdmin } from "@/lib/supabase";

export type PocStreamActivityPayload = {
  type: string;
  actorName: string;
  title: string;
  description: string;
  roomId: string;
  streamMessageId?: string;
};

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

function customKindForActivity(type: string) {
  return type.startsWith("$")
    ? type
    : `$${type}`;
}

async function listAppUserIds() {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id");

  if (error) {
    throw error;
  }

  return (data ?? []).map((user) => user.id);
}

/**
 * Broadcasts a custom Liveblocks inbox notification for POC stream activity.
 */
export async function notifyPocStreamActivity({
  subjectId,
  activity,
  actorUserId,
  recipientUserIds,
}: {
  subjectId: string;
  activity: PocStreamActivityPayload;
  actorUserId: string;
  recipientUserIds?: string[];
}) {
  const allUserIds = recipientUserIds
    ? recipientUserIds
    : await listAppUserIds();

  const userIds = allUserIds.filter(
    (id) => id !== actorUserId
  );

  if (userIds.length === 0) {
    return;
  }

  const kind = customKindForActivity(
    activity.type
  );

  await Promise.all(
    userIds.map((userId) =>
      liveblocks.triggerInboxNotification({
        userId,
        roomId: activity.roomId,
        kind,
        subjectId,
        activityData: activity,
      })
    )
  );
}
