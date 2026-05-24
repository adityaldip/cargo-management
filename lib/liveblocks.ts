export const LIVEBLOCKS_ROOM_ID =
  "mail-processing-room";

export const NOTIFICATION_REFRESH_EVENT =
  "notification:refresh";

export type NotificationRefreshEvent = {
  type: typeof NOTIFICATION_REFRESH_EVENT;
};

export type TriggerActivityInput = {
  title: string;
  description: string;
  type: string;
  subjectId: string;
};

export const createNotificationRefreshEvent =
  (): NotificationRefreshEvent => ({
    type: NOTIFICATION_REFRESH_EVENT,
  });

export const isNotificationRefreshEvent = (
  event: unknown
): event is NotificationRefreshEvent =>
  typeof event === "object" &&
  event !== null &&
  "type" in event &&
  event.type === NOTIFICATION_REFRESH_EVENT;

export const triggerActivity = async ({
  title,
  description,
  type,
  subjectId,
}: TriggerActivityInput) => {
  await fetch("/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      type,
      subjectId,
    }),
  });
};
