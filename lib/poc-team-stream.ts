import "server-only";

import { Liveblocks, LiveblocksError } from "@liveblocks/node";

import {
  getPocStreamFeedId,
  POC_TEAM_STREAM_LEGACY_FEED_ID,
  POC_TEAM_STREAM_ROOM_ID,
  POC_TEAM_STREAM_ROOM_PREFIX,
} from "@/lib/poc-team-stream-constants";
import { notifyPocStreamActivity } from "@/lib/poc-stream-activity-notify";
import { supabaseAdmin } from "@/lib/supabase";

export type PocTeamStreamMessageData = {
  type: "message";
  roomId: string;
  authorUserId: string;
  authorName: string;
  text: string;
  mentionedUserIds: string[];
};

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export function isPocTeamStreamEnabled() {
  return (
    process.env
      .LIVEBLOCKS_POC_TEAM_STREAM_ENABLED ===
    "true"
  );
}

export function buildPocStreamRoomId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 48);

  if (!slug) {
    throw new Error("Title is required.");
  }

  if (slug.startsWith(POC_TEAM_STREAM_ROOM_PREFIX)) {
    return slug;
  }

  return `${POC_TEAM_STREAM_ROOM_PREFIX}${slug}`;
}

export function isPocStreamRoomId(roomId: string) {
  return (
    roomId === POC_TEAM_STREAM_ROOM_ID ||
    roomId.startsWith(POC_TEAM_STREAM_ROOM_PREFIX)
  );
}

async function ensurePocStreamFeed(roomId: string) {
  const feedId = getPocStreamFeedId(roomId);

  try {
    await liveblocks.getFeed({
      roomId,
      feedId,
    });
  } catch (error) {
    if (
      error instanceof LiveblocksError &&
      error.status === 404
    ) {
      await liveblocks.createFeed({
        roomId,
        feedId,
        metadata: {
          label: "Team stream",
        },
      });
      return;
    }

    throw error;
  }

  if (roomId !== POC_TEAM_STREAM_ROOM_ID) {
    return;
  }

  try {
    await liveblocks.getFeed({
      roomId,
      feedId: POC_TEAM_STREAM_LEGACY_FEED_ID,
    });
  } catch {
    // No legacy feed — nothing to migrate.
  }
}

export type PocStreamRoomMetadata = {
  title: string;
  description: string;
};

function trimMetadataField(
  value: string,
  maxLength = 256
) {
  return value.trim().slice(0, maxLength);
}

function roomMetadataFromLiveblocks(
  roomId: string,
  metadata?: Record<
    string,
    string | string[] | boolean | number
  >
): PocStreamRoomMetadata {
  const title =
    typeof metadata?.title === "string"
      ? metadata.title.trim()
      : typeof metadata?.label === "string"
        ? metadata.label.trim()
        : roomId;

  const description =
    typeof metadata?.description === "string"
      ? metadata.description.trim()
      : "";

  return {
    title: title || roomId,
    description,
  };
}

export async function ensurePocStreamRoom(
  roomId: string,
  meta?: PocStreamRoomMetadata
) {
  if (!isPocStreamRoomId(roomId)) {
    throw new Error("Invalid POC stream room id.");
  }

  const metadata = meta
    ? {
        title: trimMetadataField(meta.title),
        description: trimMetadataField(
          meta.description
        ),
        label: trimMetadataField(meta.title),
      }
    : undefined;

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: ["room:write"],
    metadata,
  });

  await ensurePocStreamFeed(roomId);
}

export async function createPocStreamRoom(input: {
  title: string;
  description?: string;
  actorUserId: string;
  actorName: string;
}) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const roomId = buildPocStreamRoomId(title);
  const description =
    input.description?.trim() ?? "";

  await ensurePocStreamRoom(roomId, {
    title,
    description,
  });

  try {
    await notifyPocStreamActivity({
      subjectId: roomId,
      actorUserId: input.actorUserId,
      activity: {
        type: "room_created",
        actorName: input.actorName,
        title: `Created stream "${title}"`,
        description:
          description ||
          `New team stream: ${title}`,
        roomId,
      },
    });
  } catch (activityError) {
    console.error(
      "Unable to notify POC stream room activity.",
      activityError
    );
  }

  return {
    id: roomId,
    title,
    description,
    label: title,
  };
}

export type PocStreamRoomSummary = {
  id: string;
  title: string;
  description: string;
  /** @deprecated Use `title`. */
  label: string;
  lastConnectionAt?: string;
};

export async function listPocStreamRooms() {
  await ensurePocStreamRoom(
    POC_TEAM_STREAM_ROOM_ID,
    {
      title: "General",
      description:
        "Default team stream for quick experiments.",
    }
  );

  const rooms: PocStreamRoomSummary[] = [];
  const seen = new Set<string>();

  const addRoom = (
    id: string,
    meta: PocStreamRoomMetadata,
    lastConnectionAt?: Date
  ) => {
    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    rooms.push({
      id,
      title: meta.title,
      description: meta.description,
      label: meta.title,
      lastConnectionAt:
        lastConnectionAt?.toISOString(),
    });
  };

  addRoom(POC_TEAM_STREAM_ROOM_ID, {
    title: "General",
    description:
      "Default team stream for quick experiments.",
  });

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
    const meta = roomMetadataFromLiveblocks(
      room.id,
      room.metadata
    );

    addRoom(
      room.id,
      meta,
      room.lastConnectionAt
    );
  }

  return rooms.sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export async function getPocStreamRoom(
  roomId: string
) {
  if (!isPocStreamRoomId(roomId)) {
    return null;
  }

  if (roomId === POC_TEAM_STREAM_ROOM_ID) {
    return {
      id: roomId,
      title: "General",
      description:
        "Default team stream for quick experiments.",
      label: "General",
    };
  }

  try {
    const room = await liveblocks.getRoom(roomId);
    const meta = roomMetadataFromLiveblocks(
      room.id,
      room.metadata
    );

    return {
      id: room.id,
      title: meta.title,
      description: meta.description,
      label: meta.title,
    };
  } catch (error) {
    if (
      error instanceof LiveblocksError &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }
}

async function validateMentionedUserIds(
  mentionedUserIds: string[]
) {
  const uniqueIds = [
    ...new Set(mentionedUserIds.filter(Boolean)),
  ];

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map((user) => user.id);
}

async function notifyPocMentions({
  roomId,
  subjectId,
  authorUserId,
  authorName,
  text,
  mentionedUserIds,
}: {
  roomId: string;
  subjectId: string;
  authorUserId: string;
  authorName: string;
  text: string;
  mentionedUserIds: string[];
}) {
  const recipients = mentionedUserIds.filter(
    (id) => id !== authorUserId
  );

  if (recipients.length === 0) {
    return;
  }

  const preview =
    text.trim().slice(0, 120) || "New mention";

  await Promise.all(
    recipients.map((userId) =>
      liveblocks.triggerInboxNotification({
        userId,
        roomId,
        kind: "$poc_mention",
        subjectId,
        activityData: {
          type: "poc_mention",
          actorName: authorName,
          title: `${authorName} mentioned you`,
          description: preview,
          roomId,
        },
      })
    )
  );
}

export async function createPocTeamStreamMessage({
  roomId,
  authorUserId,
  authorName,
  text,
  mentionedUserIds = [],
}: {
  roomId: string;
  authorUserId: string;
  authorName: string;
  text: string;
  mentionedUserIds?: string[];
}) {
  await ensurePocStreamRoom(roomId);

  const validMentionIds =
    await validateMentionedUserIds(
      mentionedUserIds
    );

  const message =
    await liveblocks.createFeedMessage({
      roomId,
      feedId: getPocStreamFeedId(roomId),
      data: {
        type: "message",
        roomId,
        authorUserId,
        authorName,
        text: text.trim().slice(0, 2000),
        mentionedUserIds: validMentionIds,
      },
    });

  try {
    await notifyPocMentions({
      roomId,
      subjectId: message.id,
      authorUserId,
      authorName,
      text,
      mentionedUserIds: validMentionIds,
    });
  } catch (mentionError) {
    console.error(
      "Unable to notify POC stream mentions.",
      mentionError
    );
  }

  return message;
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

export async function listPocTeamStreamMessages(
  roomId: string
) {
  await ensurePocStreamRoom(roomId);

  const feedIds = [
    getPocStreamFeedId(roomId),
  ];

  if (roomId === POC_TEAM_STREAM_ROOM_ID) {
    feedIds.push(POC_TEAM_STREAM_LEGACY_FEED_ID);
  }

  const merged = new Map<
    string,
    Awaited<
      ReturnType<
        typeof liveblocks.getFeedMessages
      >
    >["data"][number]
  >();

  for (const feedId of feedIds) {
    try {
      const { data } =
        await liveblocks.getFeedMessages({
          roomId,
          feedId,
        });

      for (const message of data) {
        if (
          messageBelongsToRoom(
            message.data as PocTeamStreamMessageData,
            roomId
          )
        ) {
          merged.set(message.id, message);
        }
      }
    } catch (error) {
      if (
        !(
          error instanceof LiveblocksError &&
          error.status === 404
        )
      ) {
        throw error;
      }
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
}

const SAMPLE_MESSAGES = [
  "Welcome to this stream room.",
  "Use @ to mention a teammate.",
  "Create more rooms from the dropdown above.",
];

export async function seedPocTeamStreamMessages(
  roomId: string,
  authorUserId: string,
  authorName: string
) {
  const created = [];

  for (const text of SAMPLE_MESSAGES) {
    const message =
      await createPocTeamStreamMessage({
        roomId,
        authorUserId,
        authorName,
        text,
      });
    created.push(message);
  }

  return created;
}
