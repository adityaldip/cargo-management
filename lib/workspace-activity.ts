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

async function resolveRecipientUserIds({
  activity,
  recipientUserIds,
  actorUserId,
  postAuthorUserId,
}: {
  activity: WorkspaceActivityPayload;
  recipientUserIds?: string[];
  actorUserId?: string;
  postAuthorUserId?: string | null;
}) {
  if (recipientUserIds) {
    return recipientUserIds;
  }

  const allUserIds = await listAppUserIds();

  if (activity.type === "feed-reaction") {
    if (
      !postAuthorUserId ||
      postAuthorUserId === actorUserId
    ) {
      return [];
    }

    return [postAuthorUserId];
  }

  if (activity.type === "feed-post") {
    if (!actorUserId) {
      return allUserIds;
    }

    return allUserIds.filter(
      (id) => id !== actorUserId
    );
  }

  return allUserIds;
}

/**
 * Sends custom inbox notifications to a small recipient set.
 * Comments use Liveblocks `thread` inbox; editor @mentions use `textMention`.
 */
export async function notifyWorkspaceActivity({
  subjectId,
  activity,
  recipientUserIds,
  actorUserId,
  postAuthorUserId,
}: {
  subjectId: string;
  activity: WorkspaceActivityPayload;
  recipientUserIds?: string[];
  actorUserId?: string;
  postAuthorUserId?: string | null;
}) {
  const userIds = await resolveRecipientUserIds({
    activity,
    recipientUserIds,
    actorUserId,
    postAuthorUserId,
  });

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
        roomId: LIVEBLOCKS_ROOM_ID,
        kind,
        subjectId,
        activityData: activity,
      })
    )
  );
}
