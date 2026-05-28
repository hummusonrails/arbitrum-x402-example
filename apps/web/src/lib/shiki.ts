import "server-only";
import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | undefined;

// Long-lived singleton; the full bundle stays server-side and only HTML reaches the client.
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["typescript", "json"],
    });
  }
  return highlighterPromise;
}

export async function highlightToHtml(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, { lang, theme: "github-dark" });
}
