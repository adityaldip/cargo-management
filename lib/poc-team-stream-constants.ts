/** Client-safe constants for the team stream POC (no server-only imports). */

export const POC_TEAM_STREAM_ROOM_PREFIX =
  "poc-stream-";

/** Default room created on first use. */
export const POC_TEAM_STREAM_ROOM_ID =
  "poc-team-stream-room";

/** Legacy shared feed id (pre per-room isolation). */
export const POC_TEAM_STREAM_LEGACY_FEED_ID =
  "poc-team-stream";

/** One feed per Liveblocks room so messages never share a feed id across rooms. */
export function getPocStreamFeedId(roomId: string) {
  return `${roomId}-feed`;
}
