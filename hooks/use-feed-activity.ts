"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FEED_INBOX_REFRESH_EVENT } from "@/lib/feed-activity-refresh";
import { FEED_INBOX_POLL_INTERVAL_MS } from "@/lib/feed-constants";
import type { FeedActivityItem } from "@/lib/feed-activity-types";

export function useFeedActivity() {
  const isFirstLoadRef = useRef(true);
  const [activities, setActivities] = useState<
    FeedActivityItem[]
  >([]);
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

      const response = await fetch(
        "/api/feed-activity"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch activity feed"
        );
      }

      const result = await response.json();

      setActivities(result.activities ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(
              "Failed to fetch activity feed"
            )
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener(
      FEED_INBOX_REFRESH_EVENT,
      handleRefresh
    );

    return () => {
      window.removeEventListener(
        FEED_INBOX_REFRESH_EVENT,
        handleRefresh
      );
    };
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, FEED_INBOX_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return {
    activities,
    isLoading,
    error,
    refresh,
  };
}
