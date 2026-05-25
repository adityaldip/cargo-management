"use client";

import { ReactNode } from "react";
import { useStatus } from "@liveblocks/react";

import { FeedCollaborativeEditorLoading } from "@/components/feed-collaborative-editor-loading";

export function FeedCollaborativeEditorGate({
  children,
}: {
  children: ReactNode;
}) {
  const roomStatus = useStatus();
  const canMountEditor =
    roomStatus === "connected" ||
    roomStatus === "reconnecting";

  if (!canMountEditor) {
    return (
      <FeedCollaborativeEditorLoading
        status={roomStatus}
      />
    );
  }

  return children;
}
