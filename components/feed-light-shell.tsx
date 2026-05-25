"use client";

import { ReactNode } from "react";

import { FeedWorkspaceLayout } from "@/components/feed-workspace-layout";

export function FeedLightShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <FeedWorkspaceLayout
      title={title}
      subtitle={subtitle}
      actions={actions}
      enableLiveblocksRoom={false}
    >
      {children}
    </FeedWorkspaceLayout>
  );
}
