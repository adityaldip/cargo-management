const FEED_POST_ROOM_PREFIX = "feed-post-";

export function buildFeedRoomId(postId: string) {
  return `${FEED_POST_ROOM_PREFIX}${postId}`;
}

export function parseFeedPostIdFromRoomId(
  roomId: string
) {
  if (!roomId.startsWith(FEED_POST_ROOM_PREFIX)) {
    return null;
  }

  const postId = roomId.slice(
    FEED_POST_ROOM_PREFIX.length
  );

  return isValidFeedPostId(postId) ? postId : null;
}

export const COMPOSE_EDITOR_DEFAULT_HTML =
  "<p>Write your post here. You can add hashtags and format the message before publishing.</p>";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidFeedPostId(id: string) {
  return UUID_REGEX.test(id);
}
