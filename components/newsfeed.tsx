"use client";

import { useInboxNotifications } from "@liveblocks/react";

import {
  Plane,
  Edit,
  Plus,
  Clock3,
  Trash
} from "lucide-react";

const getActivityIcon = (type?: string) => {
  switch (type) {
    case "airport_created":
      return (
        <Plus className="h-4 w-4 text-black-500" />
      );

    case "airport_updated":
      return (
        <Edit className="h-4 w-4 text-blue-500" />
      );

    case "airport_deleted":
      return(
        <Trash className="h-4 w-4 text-red-500" />
      );
    default:
      return (
        <Plane className="h-4 w-4 text-gray-500" />
      );
  }
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  return new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  }).format(
    -Math.floor(
      (Date.now() - date.getTime()) / 60000
    ),
    "minute"
  );
};

export function Newsfeed() {
  const { inboxNotifications } =
    useInboxNotifications();

  return (
    <div className="h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border bg-white shadow-sm">
      
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">
          Activity Feed
        </h2>

        <p className="text-sm text-gray-500">
          Realtime workspace updates
        </p>
      </div>

      <div className="h-[calc(100%-80px)] overflow-y-auto p-4">
        <div className="space-y-3">
          {inboxNotifications?.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              No activity yet
            </div>
          )}

          {inboxNotifications?.map(
            (notification: any) => {
              const data =
                notification.activities[0];

              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 rounded-xl border p-4 transition-all hover:bg-gray-50"
                >
                  <div className="mt-1 rounded-full bg-gray-100 p-2">
                    {getActivityIcon(
                      data?.data?.type
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {data?.data?.title}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock3 className="h-3 w-3" />

                        {formatTimeAgo(
                          notification.notifiedAt
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {data?.data?.description}
                    </p>

                    <div className="mt-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {data?.data?.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}