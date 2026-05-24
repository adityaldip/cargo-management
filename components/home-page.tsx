"use client";

import { useState } from "react";
import { RoomProvider } from "@liveblocks/react";
import {
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { MailProcessingDashboard } from "@/components/mail-processing-dashboard";
import { Newsfeed } from "@/components/newsfeed";
import { LIVEBLOCKS_ROOM_ID } from "@/lib/liveblocks";

export function HomePage() {
  const [showFeed, setShowFeed] = useState(true);

  return (
    <RoomProvider id={LIVEBLOCKS_ROOM_ID}>
      <div className="h-screen p-4">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowFeed(!showFeed)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {showFeed ? (
              <>
                <PanelRightClose className="h-4 w-4" />
                Hide Feed
              </>
            ) : (
              <>
                <PanelRightOpen className="h-4 w-4" />
                Show Feed
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div
            className={
              showFeed
                ? "col-span-8"
                : "col-span-12"
            }
          >
            <MailProcessingDashboard />
          </div>

          {showFeed && (
            <div className="col-span-4">
              <Newsfeed />
            </div>
          )}
        </div>
      </div>
    </RoomProvider>
  );
}
