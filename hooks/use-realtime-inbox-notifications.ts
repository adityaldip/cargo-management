"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxNotificationData } from "@liveblocks/core";
import { useClient, useEventListener } from "@liveblocks/react";

import {
  LIVEBLOCKS_ROOM_ID,
  isNotificationRefreshEvent,
} from "@/lib/liveblocks";

type UseRealtimeInboxNotificationsOptions = {
  roomId?: string;
  fallbackIntervalMs?: number;
};

export function useRealtimeInboxNotifications({
  roomId = LIVEBLOCKS_ROOM_ID,
  fallbackIntervalMs = 3000,
}: UseRealtimeInboxNotificationsOptions = {}) {
  const client = useClient();
  const lastRefreshAtRef = useRef(0);
  const [inboxNotifications, setInboxNotifications] =
    useState<InboxNotificationData[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      const result =
        await client.getInboxNotifications({
          query: {
            roomId,
          },
        });

      setInboxNotifications(
        result.inboxNotifications
      );
      lastRefreshAtRef.current = Date.now();
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(
              "Failed to fetch inbox notifications"
            )
      );
    } finally {
      setIsLoading(false);
    }
  }, [client, roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState !== "visible"
        ) {
          return;
        }

        if (
          Date.now() -
            lastRefreshAtRef.current <
          fallbackIntervalMs
        ) {
          return;
        }

        void refresh();
      },
      fallbackIntervalMs
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fallbackIntervalMs, refresh]);

  useEventListener(({ event }) => {
    if (isNotificationRefreshEvent(event)) {
      void refresh();
    }
  });

  return {
    inboxNotifications,
    isLoading,
    error,
    refresh,
  };
}
