export type FeedActivityItem = {
  id: string;
  kind: string;
  iconType: string;
  actorName: string;
  title: string;
  description: string;
  notifiedAt: string;
  feedPostId: string | null;
};
