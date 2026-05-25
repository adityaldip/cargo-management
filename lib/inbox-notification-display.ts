import type { InboxNotificationData } from "@liveblocks/core";

export type InboxNotificationDisplay = {
  id: string;
  kind: string;
  iconType: string;
  actorName: string;
  description: string;
  title: string;
  notifiedAt: Date;
  feedPostId: string | null;
};

function feedPostIdFromRoomId(roomId?: string) {
  if (!roomId?.startsWith("feed-post-")) {
    return null;
  }

  return roomId.slice("feed-post-".length);
}

function customKindToIconType(kind: string) {
  if (kind.startsWith("$")) {
    return kind.slice(1);
  }

  return kind;
}

export function getInboxNotificationDisplay(
  notification: InboxNotificationData
): InboxNotificationDisplay {
  const notifiedAt = new Date(
    notification.notifiedAt
  );

  if (notification.kind === "thread") {
    const feedPostId = feedPostIdFromRoomId(
      notification.roomId
    );

    return {
      id: notification.id,
      kind: "thread",
      iconType: "feed-comment",
      actorName: "Team",
      title: feedPostId
        ? "Feed comment"
        : "Comment",
      description:
        "New comment or reply on a feed post.",
      notifiedAt,
      feedPostId,
    };
  }

  if (notification.kind === "textMention") {
    const feedPostId = feedPostIdFromRoomId(
      notification.roomId
    );

    return {
      id: notification.id,
      kind: "textMention",
      iconType: "feed-mention",
      actorName: "Someone",
      title: feedPostId
        ? "Mentioned in post"
        : "Mention",
      description:
        "You were mentioned in a collaborative post.",
      notifiedAt,
      feedPostId,
    };
  }

  const customNotification = notification as {
    kind: string;
    subjectId: string;
    roomId?: string;
    activities: Array<{
      data?: Record<string, string | undefined>;
    }>;
  };

  const activityData =
    customNotification.activities[0]?.data;
  const iconType =
    activityData?.type ??
    customKindToIconType(customNotification.kind);

  const feedPostId =
    iconType.startsWith("feed-") &&
    customNotification.subjectId
      ? customNotification.subjectId
      : feedPostIdFromRoomId(
          customNotification.roomId
        );

  return {
    id: notification.id,
    kind: customNotification.kind,
    iconType,
    actorName:
      activityData?.actorName ?? "Someone",
    title: activityData?.title ?? "Update",
    description:
      activityData?.description ?? "",
    notifiedAt,
    feedPostId,
  };
}

export function feedPostHref(feedPostId: string | null) {
  if (!feedPostId) {
    return null;
  }

  return `/feeds/${feedPostId}`;
}
