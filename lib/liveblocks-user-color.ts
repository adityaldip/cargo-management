const CURSOR_COLORS = [
  "#E57373",
  "#81C784",
  "#64B5F6",
  "#FFB74D",
  "#BA68C8",
  "#4DB6AC",
  "#F06292",
  "#A1887F",
] as const;

export function pickLiveblocksUserColor(
  userId: string
) {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash =
      userId.charCodeAt(index) +
      ((hash << 5) - hash);
  }

  return CURSOR_COLORS[
    Math.abs(hash) % CURSOR_COLORS.length
  ];
}
