"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomProvider } from "@liveblocks/react";
import {
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { Newsfeed } from "@/components/newsfeed";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";
import { useWorkflowStore } from "@/store/workflow-store";

export function FeedWorkspaceShell({
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
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const {
    activeStep,
    setActiveStep,
    isProcessing,
    isClearingData,
    isExporting,
    isBulkDeleting,
    isExecutingRules,
    isMappingAndSaving,
  } = useWorkflowStore();

  return (
    <RoomProvider id={LIVEBLOCKS_ROOM_ID}>
      <div className="h-screen bg-white p-4 text-black">
        <WorkflowNavigation
          activeStep={activeStep}
          onStepChange={(step) => {
            setActiveStep(step);
            router.push("/");
          }}
          isProcessing={isProcessing}
          isClearingData={isClearingData}
          isExporting={isExporting}
          isBulkDeleting={isBulkDeleting}
          isExecutingRules={isExecutingRules}
          isMappingAndSaving={isMappingAndSaving}
          onCollapseChange={setIsSidebarCollapsed}
        />

        <div className={`h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() =>
                setShowFeed(!showFeed)
              }
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              {showFeed ? (
                <>
                  <PanelRightClose className="h-4 w-4" />
                  Hide Feed
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-4 w-4" />
                  Show Feed
                </>
              )}
            </button>
          </div>

          <div className="grid h-full grid-cols-12 gap-4">
              <div
                className={
                  showFeed
                    ? "col-span-8 overflow-y-auto rounded-3xl border bg-white p-6 shadow-sm"
                    : "col-span-12 overflow-y-auto rounded-3xl border bg-white p-6 shadow-sm"
                }
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">
                      Workspace feed
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                      {title}
                    </h1>
                    <p className="max-w-3xl text-sm text-gray-500">
                      {subtitle}
                    </p>
                  </div>

                  {actions}
                </div>

                {children}
              </div>

              {showFeed && (
                <div className="col-span-4">
                  <Newsfeed />
                </div>
              )}
          </div>
        </div>
      </div>
    </RoomProvider>
  );
}
