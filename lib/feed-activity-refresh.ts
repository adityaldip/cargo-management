export const FEED_ACTIVITY_SIGNAL_EVENT =
  "feed-activity-signal";

export const FEED_INBOX_REFRESH_EVENT =
  "feed-inbox-refresh";

const INBOX_REFRESH_DELAYS_MS = [0, 600, 1500, 3000];

function dispatchInboxRefreshOnce() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FEED_INBOX_REFRESH_EVENT)
  );
}

/** Schedules inbox refetches so we catch Liveblocks after server fan-out. */
export function dispatchFeedInboxRefresh() {
  for (const delay of INBOX_REFRESH_DELAYS_MS) {
    if (delay === 0) {
      dispatchInboxRefreshOnce();
    } else {
      window.setTimeout(
        dispatchInboxRefreshOnce,
        delay
      );
    }
  }
}

/** User performed an action; notify peers and refresh inbox. */
export function dispatchFeedActivityRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FEED_ACTIVITY_SIGNAL_EVENT)
  );
  dispatchFeedInboxRefresh();
}
