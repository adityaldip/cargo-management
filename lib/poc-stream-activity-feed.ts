import "server-only";

import type { CommentBody } from "@liveblocks/core";
import { Liveblocks, LiveblocksError } from "@liveblocks/node";

import type {
  PocStreamActivityItem,
  PocStreamActivityType,
} from "@/lib/poc-stream-activity-types";
import { getInboxNotificationDisplay } from "@/lib/inbox-notification-display";
import type { PocTeamStreamMessageData } from "@/lib/poc-team-stream";
import {
  getPocStreamFeedId,
  POC_TEAM_STREAM_LEGACY_FEED_ID,
  POC_TEAM_STREAM_ROOM_ID,
  POC_TEAM_STREAM_ROOM_PREFIX,
} from "@/lib/poc-team-stream-constants";
import { supabaseAdmin } from "@/lib/supabase";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const MAX_ROOMS_TO_SCAN = 100;
const ROOM_BATCH_SIZE = 8;
const ACTIVITY_LIMIT = 80;
const INBOX_PAGE_SIZE = 50;
const MESSAGES_PER_ROOM_LIMIT = 30;

const POC_INBOX_ICON_TYPES = new Set([
  "room_created",
  "poc_mention",
]);

function isPocStreamRoomId(roomId: string) {
  return (
    roomId === POC_TEAM_STREAM_ROOM_ID ||
    roomId.startsWith(POC_TEAM_STREAM_ROOM_PREFIX)
  );
}

function feedMessageCreatedAtIso(
  createdAt: unknown
) {
  if (typeof createdAt === "number") {
    return new Date(createdAt).toISOString();
  }

  if (typeof createdAt === "string") {
    return createdAt;
  }

  if (createdAt instanceof Date) {
    return createdAt.toISOString();
  }

  return new Date().toISOString();
}

function messageBelongsToRoom(
  data: PocTeamStreamMessageData | undefined,
  roomId: string
) {
  if (!data || data.type !== "message") {
    return false;
  }

  if (!data.roomId) {
    return roomId === POC_TEAM_STREAM_ROOM_ID;
  }

  return data.roomId === roomId;
}

function mentionUserIdsFromBody(body: CommentBody) {
  const ids: string[] = [];

  for (const block of body.content ?? []) {
    for (const child of block.children ?? []) {
      if (
        child.type === "mention" &&
        child.kind === "user" &&
        child.id
      ) {
        ids.push(child.id);
      }
    }
  }

  return ids;
}

function commentBodyToPlainText(
  body: CommentBody,
  userNames: Map<string, string>
) {
  if (!body?.content?.length) {
    return "Comment";
  }

  const text = body.content
    .flatMap((block) => block.children ?? [])
    .map((child) => {
      if (
        "text" in child &&
        typeof child.text === "string"
      ) {
        return child.text;
      }

      if (
        child.type === "mention" &&
        child.kind === "user"
      ) {
        const name = userNames.get(child.id);
        return name ? `@${name}` : `@${child.id}`;
      }

      return "";
    })
    .join("")
    .trim();

  return text || "Comment";
}

async function loadUserNames(userIds: string[]) {
  const uniqueIds = [
    ...new Set(userIds.filter(Boolean)),
  ];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, name")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((user) => [
      user.id,
      user.name,
    ])
  );
}

type PocActivityRoom = {
  id: string;
  title: string;
  lastConnectionAt?: Date;
};

async function listAllPocActivityRooms(): Promise<
  PocActivityRoom[]
> {
  const rooms: PocActivityRoom[] = [];
  const seen = new Set<string>();

  const addRoom = (
    id: string,
    title: string,
    lastConnectionAt?: Date
  ) => {
    if (!isPocStreamRoomId(id) || seen.has(id)) {
      return;
    }

    seen.add(id);
    rooms.push({
      id,
      title: title.trim() || id,
      lastConnectionAt,
    });
  };

  addRoom(POC_TEAM_STREAM_ROOM_ID, "General");

  for await (const room of liveblocks.iterRooms(
    {
      query: {
        roomId: {
          startsWith:
            POC_TEAM_STREAM_ROOM_PREFIX,
        },
      },
    },
    { pageSize: 50 }
  )) {
    const metadata = room.metadata ?? {};
    const title =
      typeof metadata.title === "string"
        ? metadata.title
        : typeof metadata.label === "string"
          ? metadata.label
          : room.id;

    addRoom(
      room.id,
      title,
      room.lastConnectionAt
    );

    if (rooms.length >= MAX_ROOMS_TO_SCAN) {
      break;
    }
  }

  return rooms.sort((a, b) => {
    const aTime = a.lastConnectionAt?.getTime() ?? 0;
    const bTime = b.lastConnectionAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function roomIdFromNotification(
  notification: {
    roomId?: string;
    kind: string;
    activities?: Array<{
      data?: Record<string, string | undefined>;
    }>;
  }
) {
  const activityData =
    notification.activities?.[0]?.data;

  if (
    typeof activityData?.roomId === "string" &&
    isPocStreamRoomId(activityData.roomId)
  ) {
    return activityData.roomId;
  }

  if (
    notification.roomId &&
    isPocStreamRoomId(notification.roomId)
  ) {
    return notification.roomId;
  }

  return null;
}

function isPocInboxNotification(notification: {
  kind: string;
  roomId?: string;
}) {
  if (
    notification.kind === "thread" &&
    notification.roomId &&
    isPocStreamRoomId(notification.roomId)
  ) {
    return false;
  }

  const display =
    getInboxNotificationDisplay(notification);

  if (
    POC_INBOX_ICON_TYPES.has(display.iconType)
  ) {
    return true;
  }

  if (
    notification.roomId &&
    isPocStreamRoomId(notification.roomId) &&
    notification.kind.startsWith("$poc")
  ) {
    return true;
  }

  return false;
}

function inboxIconToActivityType(
  iconType: string
): PocStreamActivityType {
  switch (iconType) {
    case "room_created":
      return "room_created";
    case "poc_mention":
      return "stream_mention";
    default:
      return "stream_mention";
  }
}

async function listPocInboxActivityItems(
  userId: string
) {
  const items: PocStreamActivityItem[] = [];

  for await (const notification of liveblocks.iterInboxNotifications(
    { userId },
    { pageSize: INBOX_PAGE_SIZE }
  )) {
    if (!isPocInboxNotification(notification)) {
      continue;
    }

    const display =
      getInboxNotificationDisplay(notification);
    const roomId =
      roomIdFromNotification(notification);

    if (!roomId) {
      continue;
    }

    const activityType =
      inboxIconToActivityType(display.iconType);

    items.push({
      id: `inbox-${notification.id}`,
      type: activityType,
      iconType: activityType,
      actorName: display.actorName,
      title: display.title,
      description: display.description,
      notifiedAt: display.notifiedAt.toISOString(),
      roomId,
      streamMessageId:
        activityType === "stream_mention"
          ? notification.subjectId ?? null
          : null,
    });

    if (items.length >= ACTIVITY_LIMIT) {
      break;
    }
  }

  return items;
}

async function listStreamMessageActivityForRoom(
  room: PocActivityRoom
) {
  const feedIds = [getPocStreamFeedId(room.id)];

  if (room.id === POC_TEAM_STREAM_ROOM_ID) {
    feedIds.push(POC_TEAM_STREAM_LEGACY_FEED_ID);
  }

  const merged = new Map<
    string,
    PocStreamActivityItem
  >();

  for (const feedId of feedIds) {
    try {
      const { data } =
        await liveblocks.getFeedMessages({
          roomId: room.id,
          feedId,
        });

      for (const message of data) {
        const payload =
          message.data as PocTeamStreamMessageData;

        if (
          !messageBelongsToRoom(
            payload,
            room.id
          )
        ) {
          continue;
        }

        merged.set(message.id, {
          id: `message-${room.id}-${message.id}`,
          type: "stream_message",
          iconType: "stream_message",
          actorName:
            payload.authorName?.trim() ??
            "Teammate",
          title: `Message in ${room.title}`,
          description:
            payload.text?.trim() ??
            "New stream message",
          notifiedAt: feedMessageCreatedAtIso(
            message.createdAt
          ),
          roomId: room.id,
          streamMessageId: message.id,
        });
      }
    } catch (error) {
      if (
        !(
          error instanceof LiveblocksError &&
          error.status === 404
        )
      ) {
        console.error(
          `Unable to load feed messages for ${room.id}.`,
          error
        );
      }
    }
  }

  return Array.from(merged.values())
    .sort(
      (a, b) =>
        new Date(b.notifiedAt).getTime() -
        new Date(a.notifiedAt).getTime()
    )
    .slice(0, MESSAGES_PER_ROOM_LIMIT);
}

async function listStreamMessageActivityFromAllRooms() {
  const rooms = await listAllPocActivityRooms();
  const items: PocStreamActivityItem[] = [];

  for (
    let index = 0;
    index < rooms.length;
    index += ROOM_BATCH_SIZE
  ) {
    const batch = rooms.slice(
      index,
      index + ROOM_BATCH_SIZE
    );

    const batchResults = await Promise.all(
      batch.map((room) =>
        listStreamMessageActivityForRoom(room)
      )
    );

    for (const roomItems of batchResults) {
      items.push(...roomItems);
    }
  }

  return items;
}

async function listCommentActivityForRoom(
  room: PocActivityRoom
) {
  const { data: threads } =
    await liveblocks.getThreads({
      roomId: room.id,
    });

  const items: Array<
    PocStreamActivityItem & {
      actorUserId: string;
      commentBody: CommentBody;
    }
  > = [];

  for (const thread of threads) {
    const streamMessageId =
      typeof thread.metadata?.streamMessageId ===
      "string"
        ? thread.metadata.streamMessageId
        : null;

    for (const comment of thread.comments) {
      if ("deletedAt" in comment) {
        continue;
      }

      items.push({
        id: `comment-${room.id}-${comment.id}`,
        type: "stream_comment",
        iconType: "stream_comment",
        actorName: comment.userId,
        actorUserId: comment.userId,
        commentBody: comment.body,
        title: `Comment in ${room.title}`,
        description: "",
        notifiedAt: new Date(
          comment.createdAt
        ).toISOString(),
        roomId: room.id,
        streamMessageId,
      });
    }
  }

  return items;
}

async function listCommentActivityFromAllRooms() {
  const rooms = await listAllPocActivityRooms();
  const commentItems: Array<
    PocStreamActivityItem & {
      actorUserId: string;
      commentBody: CommentBody;
    }
  > = [];

  for (
    let index = 0;
    index < rooms.length;
    index += ROOM_BATCH_SIZE
  ) {
    const batch = rooms.slice(
      index,
      index + ROOM_BATCH_SIZE
    );

    const batchResults = await Promise.all(
      batch.map(async (room) => {
        try {
          return await listCommentActivityForRoom(
            room
          );
        } catch (threadError) {
          console.error(
            `Unable to load threads for room ${room.id}.`,
            threadError
          );
          return [];
        }
      })
    );

    for (const roomItems of batchResults) {
      commentItems.push(...roomItems);
    }
  }

  const userIds = commentItems.flatMap((item) => [
    item.actorUserId,
    ...mentionUserIdsFromBody(item.commentBody),
  ]);

  const userNames = await loadUserNames(userIds);

  return commentItems.map(
    ({
      actorUserId,
      commentBody,
      ...item
    }) => ({
      ...item,
      actorName:
        userNames.get(actorUserId) ??
        "Teammate",
      description: commentBodyToPlainText(
        commentBody,
        userNames
      ),
    })
  );
}

export async function listPocStreamActivity(
  userId: string
) {
  const [
    inboxItems,
    messageItems,
    commentItems,
  ] = await Promise.all([
    listPocInboxActivityItems(userId),
    listStreamMessageActivityFromAllRooms(),
    listCommentActivityFromAllRooms(),
  ]);

  const merged = new Map<
    string,
    PocStreamActivityItem
  >();

  for (const item of [
    ...messageItems,
    ...commentItems,
    ...inboxItems,
  ]) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values())
    .sort(
      (a, b) =>
        new Date(b.notifiedAt).getTime() -
        new Date(a.notifiedAt).getTime()
    )
    .slice(0, ACTIVITY_LIMIT);
}
