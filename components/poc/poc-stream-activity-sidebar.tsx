"use client";

import dynamic from "next/dynamic";

const LazyPocStreamActivityFeed = dynamic(
  () =>
    import(
      "@/components/poc/poc-stream-activity-feed"
    ).then((module) => ({
      default: module.PocStreamActivityFeed,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center rounded-2xl border bg-white text-sm text-gray-500">
        Loading activity...
      </div>
    ),
  }
);

export function PocStreamActivitySidebar() {
  return <LazyPocStreamActivityFeed />;
}
