"use client";

import { ReactNode } from "react";
import {
  ClientSideSuspense,
  RoomProvider,
} from "@liveblocks/react";

import { PocTeamStreamComposer } from "@/components/poc/poc-team-stream-composer";
import { PocTeamStreamMessageList } from "@/components/poc/poc-team-stream-message-list";
import { PocStreamRoomNotificationSettings } from "@/components/poc/poc-stream-room-notification-settings";
import { PocTeamStreamRoomProvider } from "@/components/poc/poc-team-stream-room-context";

function RoomLoading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClientSideSuspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
          Connecting to Liveblocks room...
        </div>
      }
    >
      {children}
    </ClientSideSuspense>
  );
}

export function PocTeamStreamWorkspace({
  roomId,
  roomLabel,
}: {
  roomId: string;
  roomLabel: string;
}) {
  const liveblocksRoomId = roomId?.trim();

  if (!liveblocksRoomId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-gray-500">
        Missing room id.
      </div>
    );
  }

  return (
    <RoomProvider
      key={liveblocksRoomId}
      id={liveblocksRoomId}
    >
      <PocTeamStreamRoomProvider
        roomId={liveblocksRoomId}
        roomLabel={roomLabel}
      >
        <PocStreamRoomNotificationSettings />
        <RoomLoading>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <PocTeamStreamMessageList
                key={liveblocksRoomId}
              />
            </div>
            <PocTeamStreamComposer />
          </div>
        </RoomLoading>
      </PocTeamStreamRoomProvider>
    </RoomProvider>
  );
}
