"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxNotificationData } from "@liveblocks/core";
import { useClient } from "@liveblocks/react";

import { FEED_INBOX_REFRESH_EVENT } from "@/lib/feed-activity-refresh";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";

export function useRealtimeInboxNotifications({
  roomId = LIVEBLOCKS_ROOM_ID,
}: {
  roomId?: string;
} = {}) {
  const client = useClient();
  const isFirstLoadRef = useRef(true);
  const [inboxNotifications, setInboxNotifications] =
    useState<InboxNotificationData[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<Error | null>(null);

  const refresh = useCallback(async () => {
    const showLoading = isFirstLoadRef.current;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

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
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(
              "Failed to fetch inbox notifications"
            )
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  }, [client, roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleInboxRefresh = () => {
      void refresh();
    };

    window.addEventListener(
      FEED_INBOX_REFRESH_EVENT,
      handleInboxRefresh
    );

    return () => {
      window.removeEventListener(
        FEED_INBOX_REFRESH_EVENT,
        handleInboxRefresh
      );
    };
  }, [refresh]);

  return {
    inboxNotifications,
    isLoading,
    error,
    refresh,
  };
}
