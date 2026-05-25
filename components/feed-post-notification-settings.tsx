"use client";

import { useEffect } from "react";
import { useUpdateRoomSubscriptionSettings } from "@liveblocks/react";

/** Ensures thread + mention inbox notifications fire for this post room. */
export function FeedPostNotificationSettings() {
  const updateRoomSubscriptionSettings =
    useUpdateRoomSubscriptionSettings();

  useEffect(() => {
    updateRoomSubscriptionSettings({
      threads: "all",
      textMentions: "mine",
    });
  }, [updateRoomSubscriptionSettings]);

  return null;
}
