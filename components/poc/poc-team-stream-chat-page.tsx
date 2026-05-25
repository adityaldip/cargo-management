"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PocTeamStreamWorkspace } from "@/components/poc/poc-team-stream-workspace";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/workflow-store";

export function PocTeamStreamChatPage({
  roomId,
  roomTitle,
  roomDescription,
}: {
  roomId: string;
  roomTitle: string;
  roomDescription: string;
}) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
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

  if (!roomId?.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-red-600">
          Invalid room.{" "}
          <Link
            href="/poc/team-stream"
            className="underline"
          >
            Back to rooms
          </Link>
        </p>
      </div>
    );
  }

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
        className={`flex h-full flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-16" : "ml-60"}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href="/poc/team-stream">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All rooms
            </Link>
          </Button>
          <div className="max-w-xl text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Stream chat
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              {roomTitle}
            </h1>
            {roomDescription ? (
              <p className="mt-1 text-sm text-gray-600">
                {roomDescription}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-white shadow-sm">
          <PocTeamStreamWorkspace
            roomId={roomId}
            roomLabel={roomTitle}
          />
        </div>
      </div>
    </div>
  );
}
