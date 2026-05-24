"use client";

import { useCallback } from "react";
import { useBroadcastEvent } from "@liveblocks/react";

import {
  createNotificationRefreshEvent,
  triggerActivity,
  type TriggerActivityInput,
} from "@/lib/liveblocks";

export function useTriggerActivityNotification() {
  const broadcastEvent = useBroadcastEvent();

  return useCallback(
    async (activity: TriggerActivityInput) => {
      await triggerActivity(activity);
      broadcastEvent(
        createNotificationRefreshEvent()
      );
    },
    [broadcastEvent]
  );
}
