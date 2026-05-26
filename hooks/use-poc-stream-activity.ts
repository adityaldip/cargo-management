"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POC_STREAM_ACTIVITY_POLL_INTERVAL_MS } from "@/lib/poc-team-stream-constants";
import { POC_STREAM_ACTIVITY_REFRESH_EVENT } from "@/lib/poc-stream-activity-refresh";
import type { PocStreamActivityItem } from "@/lib/poc-stream-activity-types";

export function usePocStreamActivity() {
  const isFirstLoadRef = useRef(true);
  const [activities, setActivities] = useState<
    PocStreamActivityItem[]
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
        "/api/poc/team-stream/activity"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch stream activity"
        );
      }

      const result = await response.json();

      setActivities(result.activities ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(
              "Failed to fetch stream activity"
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
      POC_STREAM_ACTIVITY_REFRESH_EVENT,
      handleRefresh
    );

    return () => {
      window.removeEventListener(
        POC_STREAM_ACTIVITY_REFRESH_EVENT,
        handleRefresh
      );
    };
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, POC_STREAM_ACTIVITY_POLL_INTERVAL_MS);

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
