"use client";

import { useCallback } from "react";
import { useBroadcastEvent } from "@liveblocks/react";

import { dispatchFeedActivityRefresh } from "@/lib/feed-activity-refresh";
import {
  createNotificationRefreshEvent,
  triggerActivity,
  type TriggerActivityInput,
} from "@/lib/liveblocks";

export function useTriggerActivityNotification() {
  const broadcastEvent = useBroadcastEvent();

  return useCallback(
    async (activity: TriggerActivityInput) => {
      try {
        await triggerActivity(activity);
        dispatchFeedActivityRefresh();
        broadcastEvent(
          createNotificationRefreshEvent()
        );
      } catch (error) {
        console.error(
          "Unable to record workspace activity.",
          error
        );
      }
    },
    [broadcastEvent]
  );
}
