export function plainTextToInitialContent(
  text: string
) {
  const trimmed = text.trim();

  if (!trimmed) {
    return "<p></p>";
  }

  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph.replace(/\n/g, "<br>")
    );

  return paragraphs
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}
