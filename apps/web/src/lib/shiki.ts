import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import { transformerMetaHighlight } from "@shikijs/transformers";

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

// Highlights code and bakes the emphasized lines into the markup (class "highlighted"
// on the matching .line spans), so the client never has to mutate the DOM.
export async function highlightToHtml(
  code: string,
  lang: string,
  highlightLines: number[] = []
): Promise<string> {
  const highlighter = await getHighlighter();
  const meta = highlightLines.length ? `{${highlightLines.join(",")}}` : "";
  return highlighter.codeToHtml(code, {
    lang,
    theme: "github-dark",
    meta: { __raw: meta },
    transformers: [transformerMetaHighlight()],
  });
}
