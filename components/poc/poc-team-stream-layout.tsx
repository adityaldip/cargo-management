"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { PocStreamActivitySidebar } from "@/components/poc/poc-stream-activity-sidebar";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { POC_STREAM_ACTIVITY_SIDEBAR_KEY } from "@/lib/poc-team-stream-constants";
import { useWorkflowStore } from "@/store/workflow-store";

export function PocTeamStreamLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);
  const [showActivity, setShowActivity] =
    useState(false);
  const [hasHydrated, setHasHydrated] =
    useState(false);
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

  useEffect(() => {
    const stored = window.localStorage.getItem(
      POC_STREAM_ACTIVITY_SIDEBAR_KEY
    );
    setShowActivity(stored === "true");
    setHasHydrated(true);
  }, []);

  const toggleActivity = () => {
    setShowActivity((current) => {
      const next = !current;
      window.localStorage.setItem(
        POC_STREAM_ACTIVITY_SIDEBAR_KEY,
        String(next)
      );
      return next;
    });
  };

  const activityVisible =
    hasHydrated && showActivity;

  const mainColumn = (
    <div
      className={
        activityVisible
          ? "col-span-8 flex min-h-0 flex-col overflow-hidden"
          : "col-span-12 flex min-h-0 flex-col overflow-hidden"
      }
    >
      {children}
    </div>
  );

  const streamGrid = (
    <div className="grid h-full min-h-0 grid-cols-12 gap-4">
      {mainColumn}

      {activityVisible ? (
        <div className="col-span-4 min-h-0">
          <PocStreamActivitySidebar />
        </div>
      ) : null}
    </div>
  );

  return (
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

      <div
        className={`flex h-full min-h-0 flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-16" : "ml-60"}`}
      >
        <div className="mb-4 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={toggleActivity}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {activityVisible ? (
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

        <div className="min-h-0 flex-1">
          {streamGrid}
        </div>
      </div>
    </div>
  );
}
