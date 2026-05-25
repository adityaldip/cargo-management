"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { POC_TEAM_STREAM_ROOM_ID } from "@/lib/poc-team-stream-constants";

type PocTeamStreamRoomContextValue = {
  roomId: string;
  roomLabel: string;
};

const PocTeamStreamRoomContext =
  createContext<PocTeamStreamRoomContextValue | null>(
    null
  );

export function PocTeamStreamRoomProvider({
  roomId,
  roomLabel,
  children,
}: {
  roomId: string;
  roomLabel: string;
  children: ReactNode;
}) {
  return (
    <PocTeamStreamRoomContext.Provider
      value={{ roomId, roomLabel }}
    >
      {children}
    </PocTeamStreamRoomContext.Provider>
  );
}

export function usePocTeamStreamRoom() {
  const context = useContext(
    PocTeamStreamRoomContext
  );

  if (!context) {
    return {
      roomId: POC_TEAM_STREAM_ROOM_ID,
      roomLabel: "General",
    };
  }

  return context;
}
