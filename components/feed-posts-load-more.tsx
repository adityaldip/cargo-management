"use client";

import { useState } from "react";

import { FeedPostCard } from "@/components/feed-post-card";
import { Button } from "@/components/ui/button";
import type { FeedPostListItem } from "@/lib/feed-posts";

export function FeedPostsLoadMore({
  initialPosts,
  initialHasMore,
  initialNextOffset,
  search,
}: {
  initialPosts: FeedPostListItem[];
  initialHasMore: boolean;
  initialNextOffset: number;
  search: string;
}) {
  const [posts, setPosts] =
    useState(initialPosts);
  const [hasMore, setHasMore] =
    useState(initialHasMore);
  const [offset, setOffset] = useState(
    initialNextOffset
  );
  const [isLoading, setIsLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const loadMore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: "20",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/feeds?${params.toString()}`
      );
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to load more posts."
        );
        setIsLoading(false);
        return;
      }

      setPosts((current) => [
        ...current,
        ...(result.posts ?? []),
      ]);
      setHasMore(Boolean(result.hasMore));
      setOffset(result.nextOffset ?? offset);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load more posts."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
        No posts found yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
        />
      ))}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : "Load more posts"}
          </Button>
        </div>
      )}
    </div>
  );
}
