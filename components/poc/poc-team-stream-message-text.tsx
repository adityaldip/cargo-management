export function PocTeamStreamMessageText({
  text,
}: {
  text: string;
}) {
  const parts = text.split(/(@[^\s]+)/g);

  return (
    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
      {parts.map((part, index) =>
        part.startsWith("@") ? (
          <span
            key={`${part}-${index}`}
            className="font-semibold text-violet-700"
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>
            {part}
          </span>
        )
      )}
    </p>
  );
}
