declare global {
  interface Liveblocks {
    FeedMessageData: {
      type: "message";
      roomId: string;
      authorUserId: string;
      authorName: string;
      text: string;
      mentionedUserIds: string[];
    };
    FeedMetadata: {
      label?: string;
    };
    ThreadMetadata: {
      streamMessageId: string;
    };
  }
}

export {};
