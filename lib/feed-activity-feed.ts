import "server-only";

import type { CommentBody } from "@liveblocks/core";
import { Liveblocks } from "@liveblocks/node";

import type { FeedActivityItem } from "@/lib/feed-activity-types";
import { getInboxNotificationDisplay } from "@/lib/inbox-notification-display";
import { parseFeedPostIdFromRoomId } from "@/lib/feed-room";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";
import { supabaseAdmin } from "@/lib/supabase";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const MAX_ROOMS_TO_SCAN = 100;
const ROOM_BATCH_SIZE = 8;
const ACTIVITY_LIMIT = 80;
const RECENT_PUBLISHED_POSTS_LIMIT = 40;
/** Liveblocks caps inbox page size at 50. */
const INBOX_PAGE_SIZE = 50;

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

      if (
        child.type === "mention" &&
        child.kind === "group"
      ) {
        return `@${child.id}`;
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

async function loadFeedPostTitles(
  postIds: string[]
) {
  const uniqueIds = [
    ...new Set(postIds.filter(Boolean)),
  ];

  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabaseAdmin
    .from("feed_posts")
    .select("id, title")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((post) => [
      post.id,
      post.title?.trim() || "Feed post",
    ])
  );
}

async function listInboxActivityItems(
  userId: string
) {
  const items: FeedActivityItem[] = [];

  for await (const notification of liveblocks.iterInboxNotifications(
    {
      userId,
    },
    { pageSize: INBOX_PAGE_SIZE }
  )) {
    const display =
      getInboxNotificationDisplay(notification);

    // Published posts are loaded from the database so everyone
    // (including the author) sees them in the activity feed.
    if (display.iconType === "feed-post") {
      continue;
    }

    items.push({
      id: `inbox-${notification.id}`,
      kind: display.kind,
      iconType: display.iconType,
      actorName: display.actorName,
      title: display.title,
      description: display.description,
      notifiedAt: display.notifiedAt.toISOString(),
      feedPostId: display.feedPostId,
    });

    if (items.length >= ACTIVITY_LIMIT) {
      break;
    }
  }

  return items;
}

async function listAllActivityRooms() {
  const rooms: Array<{
    id: string;
    lastConnectionAt?: Date;
  }> = [];

  for await (const room of liveblocks.iterRooms(
    {
      query: {
        roomId: {
          startsWith: "feed-post-",
        },
      },
    },
    { pageSize: 50 }
  )) {
    rooms.push({
      id: room.id,
      lastConnectionAt: room.lastConnectionAt,
    });

    if (rooms.length >= MAX_ROOMS_TO_SCAN) {
      break;
    }
  }

  const roomIds = new Set(
    rooms.map((room) => room.id)
  );

  if (!roomIds.has(LIVEBLOCKS_ROOM_ID)) {
    rooms.push({
      id: LIVEBLOCKS_ROOM_ID,
    });
  }

  return rooms.sort((a, b) => {
    const aTime = a.lastConnectionAt?.getTime() ?? 0;
    const bTime = b.lastConnectionAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

async function listCommentActivityForRoom(
  roomId: string,
  postTitles: Map<string, string>
) {
  const feedPostId =
    parseFeedPostIdFromRoomId(roomId);
  const title = feedPostId
    ? (postTitles.get(feedPostId) ?? "Feed post")
    : "Workspace";

  const { data: threads } =
    await liveblocks.getThreads({
      roomId,
    });

  const items: Array<
    FeedActivityItem & {
      actorUserId: string;
      commentBody: CommentBody;
    }
  > = [];

  for (const thread of threads) {
    for (const comment of thread.comments) {
      if ("deletedAt" in comment) {
        continue;
      }

      const threadPostId =
        typeof thread.metadata?.feedPostId ===
        "string"
          ? thread.metadata.feedPostId
          : feedPostId;

      items.push({
        id: `comment-${roomId}-${comment.id}`,
        kind: "feed-comment",
        iconType: "feed-comment",
        actorName: comment.userId,
        actorUserId: comment.userId,
        commentBody: comment.body,
        title:
          (threadPostId &&
            postTitles.get(threadPostId)) ||
          title,
        description: "",
        notifiedAt: new Date(
          comment.createdAt
        ).toISOString(),
        feedPostId: threadPostId ?? feedPostId,
      });
    }
  }

  return items;
}

async function listRecentPublishedPostActivity() {
  const { data: posts, error } =
    await supabaseAdmin
      .from("feed_posts")
      .select(
        `
        id,
        title,
        body_preview,
        updated_at,
        created_at,
        author:app_users!feed_posts_author_user_id_fkey (
          id,
          name
        )
      `
      )
      .eq("is_published", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(RECENT_PUBLISHED_POSTS_LIMIT);

  if (error) {
    throw error;
  }

  return (posts ?? []).map((post) => {
    const author = Array.isArray(post.author)
      ? post.author[0]
      : post.author;

    return {
      id: `post-${post.id}`,
      kind: "$feed-post",
      iconType: "feed-post",
      actorName:
        author?.name?.trim() ?? "Teammate",
      title: post.title?.trim() || "New post",
      description:
        post.body_preview?.trim() ?? "",
      notifiedAt:
        post.updated_at ?? post.created_at,
      feedPostId: post.id,
    };
  });
}

async function listCommentActivityFromAllRooms() {
  const rooms = await listAllActivityRooms();
  const postIds = rooms
    .map((room) =>
      parseFeedPostIdFromRoomId(room.id)
    )
    .filter((id): id is string => Boolean(id));

  const postTitles =
    await loadFeedPostTitles(postIds);

  const commentItems: FeedActivityItem[] = [];

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
            room.id,
            postTitles
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

export async function listFeedActivity(
  userId: string
) {
  const [inboxItems, commentItems, postItems] =
    await Promise.all([
      listInboxActivityItems(userId),
      listCommentActivityFromAllRooms(),
      listRecentPublishedPostActivity(),
    ]);

  const merged = new Map<string, FeedActivityItem>();

  for (const item of [
    ...postItems,
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
