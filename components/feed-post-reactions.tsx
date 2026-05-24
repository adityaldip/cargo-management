"use client";

import { useState } from "react";

import { FEED_POST_EMOJIS } from "@/lib/feed-constants";

type ReactionCounts = Record<string, number>;

export function FeedPostReactions({
  feedPostId,
  initialCounts,
  initialSelected,
}: {
  feedPostId: string;
  initialCounts: ReactionCounts;
  initialSelected: string[];
}) {
  const [counts, setCounts] = useState(
    initialCounts
  );
  const [selected, setSelected] = useState(
    new Set(initialSelected)
  );

  const toggleReaction = async (
    emoji: string
  ) => {
    const response = await fetch(
      `/api/feeds/${feedPostId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      }
    );

    if (!response.ok) {
      return;
    }

    const result = await response.json();

    setCounts((prev) => {
      const next = { ...prev };
      next[emoji] = Math.max(
        0,
        (next[emoji] ?? 0) +
          (result.added ? 1 : -1)
      );
      return next;
    });

    setSelected((prev) => {
      const next = new Set(prev);
      if (result.added) {
        next.add(emoji);
      } else {
        next.delete(emoji);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FEED_POST_EMOJIS.map((emoji) => {
        const isSelected =
          selected.has(emoji);
        const count = counts[emoji] ?? 0;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggleReaction(emoji)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
