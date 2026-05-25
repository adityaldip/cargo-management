import "server-only";

import { randomUUID } from "crypto";

import {
  FEED_POST_EMOJIS,
  FEED_POSTS_PAGE_SIZE,
} from "@/lib/feed-constants";
import {
  buildFeedRoomId,
  isValidFeedPostId,
} from "@/lib/feed-room";
import { supabaseAdmin } from "@/lib/supabase";

export { buildFeedRoomId } from "@/lib/feed-room";

export type FeedPostListItem = {
  id: string;
  liveblocks_room_id: string;
  title: string;
  body_preview: string;
  body_plain_text?: string;
  hashtags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
  reactions: Record<string, number>;
  currentUserReactions: string[];
};

export function extractHashtags(
  text: string
) {
  return Array.from(
    new Set(
      Array.from(
        text.matchAll(
          /(^|\s)#([a-zA-Z0-9_-]+)/g
        )
      ).map((match) =>
        match[2].toLowerCase()
      )
    )
  );
}

function buildPreview(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 240);
}

function mapReactions(
  reactions:
    | {
        emoji: string;
        user_id: string;
      }[]
    | null
    | undefined,
  currentUserId: string
) {
  const counts: Record<string, number> = {};
  const currentUserReactions = new Set<string>();

  for (const reaction of reactions ?? []) {
    counts[reaction.emoji] =
      (counts[reaction.emoji] ?? 0) + 1;

    if (reaction.user_id === currentUserId) {
      currentUserReactions.add(reaction.emoji);
    }
  }

  return {
    counts,
    currentUserReactions: Array.from(
      currentUserReactions
    ),
  };
}

export async function createFeedPost(
  input: {
    id?: string;
    authorUserId: string;
    title: string;
    bodyPlainText: string;
    isPublished?: boolean;
  }
) {
  const id =
    input.id?.trim() || randomUUID();

  if (!isValidFeedPostId(id)) {
    throw new Error("Invalid post id.");
  }

  const { data: existingPost } =
    await supabaseAdmin
      .from("feed_posts")
      .select("id")
      .eq("id", id)
      .maybeSingle();

  if (existingPost) {
    throw new Error("Post id already exists.");
  }

  const liveblocksRoomId = buildFeedRoomId(id);
  const plainText =
    input.bodyPlainText.trim();

  const { data: createdPost, error } =
    await supabaseAdmin
      .from("feed_posts")
      .insert({
        id,
        liveblocks_room_id: liveblocksRoomId,
        author_user_id: input.authorUserId,
        title:
          input.title.trim() || "Untitled post",
        body_plain_text: plainText,
        body_preview: buildPreview(plainText),
        hashtags: extractHashtags(plainText),
        is_published:
          input.isPublished ?? true,
      })
      .select(
        "id, liveblocks_room_id"
      )
      .single();

  if (error) {
    throw error;
  }
  return createdPost;
}

export type FeedPostsPageResult = {
  posts: FeedPostListItem[];
  hasMore: boolean;
  nextOffset: number;
};

export async function listFeedPosts(
  currentUserId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<FeedPostsPageResult> {
  const limit =
    options?.limit ?? FEED_POSTS_PAGE_SIZE;
  const offset = options?.offset ?? 0;
  const normalizedSearch =
    options?.search?.trim().toLowerCase() ??
    "";

  let query = supabaseAdmin
    .from("feed_posts")
    .select(
      `
        id,
        liveblocks_room_id,
        title,
        body_preview,
        hashtags,
        is_published,
        created_at,
        updated_at,
        author:app_users!feed_posts_author_user_id_fkey (
          id,
          name,
          email
        ),
        reactions:feed_post_reactions (
          emoji,
          user_id
        )
      `
    )
    .eq("is_published", true)
    .order("created_at", {
      ascending: false,
    });

  if (normalizedSearch) {
    const hashtagSearch =
      normalizedSearch.startsWith("#")
        ? normalizedSearch.slice(1)
        : normalizedSearch;

    query = query.or(
      [
        `title.ilike.%${normalizedSearch}%`,
        `body_preview.ilike.%${normalizedSearch}%`,
        `hashtags.cs.{${hashtagSearch}}`,
      ].join(",")
    );
  }

  const { data, error } = await query.range(
    offset,
    offset + limit
  );

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore
    ? rows.slice(0, limit)
    : rows;

  const posts = pageRows.map((post) => {
    const reactionSummary = mapReactions(
      post.reactions,
      currentUserId
    );

    return {
      ...post,
      author: Array.isArray(post.author)
        ? post.author[0] ?? null
        : post.author,
      reactions: reactionSummary.counts,
      currentUserReactions:
        reactionSummary.currentUserReactions,
    } satisfies FeedPostListItem;
  });

  return {
    posts,
    hasMore,
    nextOffset: offset + posts.length,
  };
}

export async function getFeedPost(
  id: string,
  currentUserId: string
) {
  const { data, error } = await supabaseAdmin
    .from("feed_posts")
    .select(
      `
        id,
        liveblocks_room_id,
        title,
        body_preview,
        body_plain_text,
        hashtags,
        is_published,
        created_at,
        updated_at,
        author:app_users!feed_posts_author_user_id_fkey (
          id,
          name,
          email
        ),
        reactions:feed_post_reactions (
          emoji,
          user_id
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const reactionSummary = mapReactions(
    data.reactions,
    currentUserId
  );

  return {
    ...data,
    author: Array.isArray(data.author)
      ? data.author[0] ?? null
      : data.author,
    reactions: reactionSummary.counts,
    currentUserReactions:
      reactionSummary.currentUserReactions,
  } satisfies FeedPostListItem;
}

export async function updateFeedPostSnapshot(
  id: string,
  input: {
    title: string;
    bodyPlainText: string;
    isPublished?: boolean;
  }
) {
  const plainText =
    input.bodyPlainText.trim();

  const { data, error } = await supabaseAdmin
    .from("feed_posts")
    .update({
      title:
        input.title.trim() || "Untitled post",
      body_plain_text: plainText,
      body_preview: buildPreview(plainText),
      hashtags: extractHashtags(plainText),
      ...(typeof input.isPublished ===
      "boolean"
        ? {
            is_published:
              input.isPublished,
          }
        : {}),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFeedPostTitle(
  feedPostId: string
) {
  const { data, error } = await supabaseAdmin
    .from("feed_posts")
    .select("title")
    .eq("id", feedPostId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.title?.trim() || "Untitled post";
}

export async function toggleFeedReaction(
  input: {
    feedPostId: string;
    userId: string;
    emoji: string;
  }
) {
  const { data: existingReaction, error } =
    await supabaseAdmin
      .from("feed_post_reactions")
      .select("id")
      .eq("feed_post_id", input.feedPostId)
      .eq("user_id", input.userId)
      .eq("emoji", input.emoji)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (existingReaction) {
    const { error: deleteError } =
      await supabaseAdmin
        .from("feed_post_reactions")
        .delete()
        .eq("id", existingReaction.id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      added: false,
    };
  }

  const { error: insertError } =
    await supabaseAdmin
      .from("feed_post_reactions")
      .insert({
        feed_post_id: input.feedPostId,
        user_id: input.userId,
        emoji: input.emoji,
      });

  if (insertError) {
    throw insertError;
  }

  return {
    added: true,
  };
}
