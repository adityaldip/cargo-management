"use client";

import Link from "next/link";
import {
  Plane,
  Edit,
  Plus,
  Clock3,
  Trash,
  MessageCircle,
  FileText,
  SmilePlus,
  AtSign,
} from "lucide-react";

import { useFeedActivity } from "@/hooks/use-feed-activity";
import { feedPostHref } from "@/lib/inbox-notification-display";
import { formatTimeAgo } from "@/lib/format-times";

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
      return (
        <Trash className="h-4 w-4 text-red-500" />
      );
    case "feed-comment":
    case "thread":
      return (
        <MessageCircle className="h-4 w-4 text-sky-600" />
      );
    case "feed-mention":
    case "textMention":
      return (
        <AtSign className="h-4 w-4 text-violet-600" />
      );
    case "feed-post":
      return (
        <FileText className="h-4 w-4 text-emerald-600" />
      );
    case "feed-reaction":
      return (
        <SmilePlus className="h-4 w-4 text-amber-600" />
      );
    default:
      return (
        <Plane className="h-4 w-4 text-gray-500" />
      );
  }
};

export function Newsfeed() {
  const {
    activities,
    isLoading,
    error,
  } = useFeedActivity();

  return (
    <div className="h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border bg-white shadow-sm flex flex-col">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">
          Activity Feed
        </h2>

        <p className="text-sm text-gray-500">
          Realtime workspace updates
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
            const href = feedPostHref(
              activity.feedPostId
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
                    {activity.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {activity.title}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {activity.kind}
                    </span>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={activity.id}>
                {href ? (
                  <Link href={href}>{card}</Link>
                ) : (
                  card
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
