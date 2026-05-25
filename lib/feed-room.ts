export function buildFeedRoomId(postId: string) {
  return `feed-post-${postId}`;
}

export const COMPOSE_EDITOR_DEFAULT_HTML =
  "<p>Write your post here. You can add hashtags and format the message before publishing.</p>";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidFeedPostId(id: string) {
  return UUID_REGEX.test(id);
}
