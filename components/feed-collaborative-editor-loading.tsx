export function FeedCollaborativeEditorLoading({
  status,
}: {
  status?: string;
}) {
  const message =
    status === "connecting" || status === "reconnecting"
      ? "Connecting to collaboration room…"
      : status === "initial"
        ? "Preparing collaboration room…"
        : "Connecting collaborative editor…";

  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-gray-200 bg-white text-sm text-gray-500">
      {message}
    </div>
  );
}
