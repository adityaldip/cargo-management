"use client";

import { ReactNode } from "react";

import { FeedWorkspaceLayout } from "@/components/feed-workspace-layout";

export function FeedDetailShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <FeedWorkspaceLayout
      title={title}
      subtitle={subtitle}
      enableLiveblocksRoom
    >
      {children}
    </FeedWorkspaceLayout>
  );
}
