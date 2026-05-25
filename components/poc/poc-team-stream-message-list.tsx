"use client";

import { useFeedMessages } from "@liveblocks/react";
import { Loader2 } from "lucide-react";

import { PocStreamMessageComments } from "@/components/poc/poc-stream-message-comments";
import { PocTeamStreamMessageText } from "@/components/poc/poc-team-stream-message-text";
import { usePocTeamStreamRoom } from "@/components/poc/poc-team-stream-room-context";
import {
  getPocStreamFeedId,
  POC_TEAM_STREAM_ROOM_ID,
} from "@/lib/poc-team-stream-constants";
import { formatTimeAgo } from "@/lib/format-times";

function messageCreatedAtIso(createdAt: unknown) {
  if (typeof createdAt === "string") {
    return createdAt;
  }

  if (typeof createdAt === "number") {
    return new Date(createdAt).toISOString();
  }

  if (createdAt instanceof Date) {
    return createdAt.toISOString();
  }

  return new Date().toISOString();
}

function messageBelongsToRoom(
  data: Record<string, unknown> | undefined,
  roomId: string
) {
  if (
    !data ||
    data.type !== "message"
  ) {
    return false;
  }

  const messageRoomId = data.roomId;

  if (
    typeof messageRoomId !== "string" ||
    !messageRoomId
  ) {
    return roomId === POC_TEAM_STREAM_ROOM_ID;
  }

  return messageRoomId === roomId;
}

export function PocTeamStreamMessageList() {
  const { roomId } = usePocTeamStreamRoom();
  const feedId = getPocStreamFeedId(roomId);
  const { messages, isLoading, error } =
    useFeedMessages(feedId);

  const streamMessages = (
    messages ?? []
  ).filter((message) =>
    messageBelongsToRoom(
      message.data as
        | Record<string, unknown>
        | undefined,
      roomId
    )
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-violet-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting to team stream...
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center text-sm text-red-600">
        {error.message}
      </p>
    );
  }

  if (streamMessages.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        No messages yet. Send one below or use
        &quot;Add sample messages&quot;.
      </p>
    );
  }

  return (
    <ul
      key={feedId}
      className="space-y-3"
    >
      {streamMessages.map((message) => {
        const data = message.data as {
          type: string;
          authorName: string;
          text: string;
          mentionedUserIds?: string[];
        };

        return (
          <li
            key={message.id}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {data.authorName}
              </p>
              <span className="text-xs text-gray-400">
                {formatTimeAgo(
                  messageCreatedAtIso(
                    message.createdAt
                  )
                )}
              </span>
            </div>
            <PocTeamStreamMessageText
              text={data.text}
            />
            {data.mentionedUserIds?.length ? (
              <p className="mt-2 text-xs text-violet-600">
                Notified{" "}
                {data.mentionedUserIds.length}{" "}
                mentioned teammate
                {data.mentionedUserIds.length === 1
                  ? ""
                  : "s"}
              </p>
            ) : null}
            <PocStreamMessageComments
              streamMessageId={message.id}
            />
          </li>
        );
      })}
    </ul>
  );
}
