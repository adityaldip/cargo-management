"use client";

import { ReactNode } from "react";

import { FeedWorkspaceLayout } from "@/components/feed-workspace-layout";

export function FeedComposeShell({
  title,
  subtitle,
  collaborationRoomId,
  children,
}: {
  title: string;
  subtitle: string;
  collaborationRoomId: string;
  children: ReactNode;
}) {
  return (
    <FeedWorkspaceLayout
      title={title}
      subtitle={subtitle}
      collaborationRoomId={collaborationRoomId}
    >
      {children}
    </FeedWorkspaceLayout>
  );
}
