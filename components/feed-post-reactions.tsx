"use client";

import { useState } from "react";

import { dispatchFeedActivityRefresh } from "@/lib/feed-activity-refresh";
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
  const [pending, setPending] = useState(
    new Set<string>()
  );

  const toggleReaction = async (
    emoji: string
  ) => {
    if (pending.has(emoji)) {
      return;
    }

    const wasSelected = selected.has(emoji);
    const previousCount = counts[emoji] ?? 0;

    setPending((prev) => new Set(prev).add(emoji));
    setSelected((prev) => {
      const next = new Set(prev);
      if (wasSelected) {
        next.delete(emoji);
      } else {
        next.add(emoji);
      }
      return next;
    });
    setCounts((prev) => {
      const next = { ...prev };
      next[emoji] = Math.max(
        0,
        previousCount + (wasSelected ? -1 : 1)
      );
      return next;
    });

    try {
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
        throw new Error("Reaction request failed");
      }

      const result = await response.json();
      const expectedAdded = !wasSelected;

      if (result.added) {
        dispatchFeedActivityRefresh();
      }

      if (result.added !== expectedAdded) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (result.added) {
            next.add(emoji);
          } else {
            next.delete(emoji);
          }
          return next;
        });
        setCounts((prev) => {
          const next = { ...prev };
          next[emoji] = Math.max(
            0,
            previousCount + (result.added ? 1 : -1)
          );
          return next;
        });
      }
    } catch {
      setSelected((prev) => {
        const next = new Set(prev);
        if (wasSelected) {
          next.add(emoji);
        } else {
          next.delete(emoji);
        }
        return next;
      });
      setCounts((prev) => {
        const next = { ...prev };
        next[emoji] = previousCount;
        return next;
      });
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FEED_POST_EMOJIS.map((emoji) => {
        const isSelected =
          selected.has(emoji);
        const count = counts[emoji] ?? 0;

        const isPending = pending.has(emoji);

        return (
          <button
            key={emoji}
            type="button"
            disabled={isPending}
            onClick={() => toggleReaction(emoji)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
            } ${isPending ? "opacity-80" : ""}`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
