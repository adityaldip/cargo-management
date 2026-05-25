"use client";

import { useEffect } from "react";
import { useUpdateRoomSubscriptionSettings } from "@liveblocks/react";

/** Thread inbox notifications for stream room comments. */
export function PocStreamRoomNotificationSettings() {
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
