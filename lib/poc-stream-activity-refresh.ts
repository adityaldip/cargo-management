export const POC_STREAM_ACTIVITY_REFRESH_EVENT =
  "poc-stream-activity:refresh";

export function dispatchPocStreamActivityRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      POC_STREAM_ACTIVITY_REFRESH_EVENT
    )
  );
}
