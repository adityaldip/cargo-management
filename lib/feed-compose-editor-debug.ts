const PREFIX = "[FeedComposeEditor]";

export function logFeedComposeEditor(
  step: string,
  details?: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (details) {
    console.log(PREFIX, step, details);
  } else {
    console.log(PREFIX, step);
  }
}
