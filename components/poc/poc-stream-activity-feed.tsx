"use client";

import Link from "next/link";
import {
  AtSign,
  Clock3,
  DoorOpen,
  FileText,
  MessageCircle,
} from "lucide-react";

import { usePocStreamActivity } from "@/hooks/use-poc-stream-activity";
import { pocStreamRoomHref } from "@/lib/poc-team-stream-constants";
import { formatTimeAgo } from "@/lib/format-times";

const getActivityIcon = (type?: string) => {
  switch (type) {
    case "room_created":
      return (
        <DoorOpen className="h-4 w-4 text-emerald-600" />
      );
    case "stream_message":
      return (
        <FileText className="h-4 w-4 text-emerald-600" />
      );
    case "stream_comment":
      return (
        <MessageCircle className="h-4 w-4 text-sky-600" />
      );
    case "stream_mention":
    case "poc_mention":
      return (
        <AtSign className="h-4 w-4 text-violet-600" />
      );
    default:
      return (
        <MessageCircle className="h-4 w-4 text-gray-500" />
      );
  }
};

export function PocStreamActivityFeed() {
  const {
    activities,
    isLoading,
    error,
  } = usePocStreamActivity();

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">
          Activity Feed
        </h2>

        <p className="text-sm text-gray-500">
          All stream rooms — Liveblocks
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {isLoading && (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading activity...
            </div>
          )}

          {error && !isLoading && (
            <div className="py-10 text-center text-sm text-red-600">
              {error.message}
            </div>
          )}

          {!isLoading &&
            !error &&
            activities.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">
                No activity yet
              </div>
            )}

          {activities.map((activity) => {
            const href = pocStreamRoomHref(
              activity.roomId
            );

            const card = (
              <div className="flex items-start gap-3 rounded-xl border p-4 transition-all hover:bg-gray-50">
                <div className="mt-1 rounded-full bg-gray-100 p-2">
                  {getActivityIcon(
                    activity.iconType
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {activity.actorName}
                      </p>
                      <div className="rounded-full bg-gray-100 p-1.5">
                        {getActivityIcon(
                          activity.iconType
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 className="h-3 w-3" />

                      {formatTimeAgo(
                        activity.notifiedAt
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {activity.description ||
                      activity.title}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {activity.title}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {activity.type}
                    </span>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={activity.id}>
                <Link href={href}>{card}</Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
