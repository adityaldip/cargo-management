export type PocStreamActivityType =
  | "room_created"
  | "stream_message"
  | "stream_comment"
  | "stream_mention";

export type PocStreamActivityItem = {
  id: string;
  type: PocStreamActivityType;
  iconType: PocStreamActivityType;
  actorName: string;
  title: string;
  description: string;
  notifiedAt: string;
  roomId: string;
  streamMessageId: string | null;
};
