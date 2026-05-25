"use client";

import { useEffect } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react";

import {
  dispatchFeedInboxRefresh,
  FEED_ACTIVITY_SIGNAL_EVENT,
} from "@/lib/feed-activity-refresh";
import {
  createNotificationRefreshEvent,
  isNotificationRefreshEvent,
} from "@/lib/liveblocks";

/** Forwards local activity signals into the Liveblocks room (no UI). */
export function FeedActivityRefreshBridge() {
  const broadcastEvent = useBroadcastEvent();

  useEffect(() => {
    const handleActivitySignal = () => {
      broadcastEvent(
        createNotificationRefreshEvent()
      );
    };

    window.addEventListener(
      FEED_ACTIVITY_SIGNAL_EVENT,
      handleActivitySignal
    );

    return () => {
      window.removeEventListener(
        FEED_ACTIVITY_SIGNAL_EVENT,
        handleActivitySignal
      );
    };
  }, [broadcastEvent]);

  useEventListener(({ event }) => {
    if (isNotificationRefreshEvent(event)) {
      dispatchFeedInboxRefresh();
    }
  });

  return null;
}
