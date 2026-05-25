"use client";

import dynamic from "next/dynamic";

const LazyNewsfeed = dynamic(
  () =>
    import("@/components/newsfeed").then(
      (module) => ({
        default: module.Newsfeed,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center rounded-2xl border bg-white text-sm text-gray-500">
        Loading activity...
      </div>
    ),
  }
);

export function FeedActivitySidebar() {
  return <LazyNewsfeed />;
}
