import { SNIPPETS } from "@/generated/snippets";
import { STEPS } from "@/content/lesson";
import { highlightToHtml } from "@/lib/shiki";
import { resolveHighlightLines } from "@/lib/snippets";
import { isLiveConfigured } from "@/lib/env";
import { Walkthrough } from "@/components/Walkthrough";

export default async function Page() {
  // One highlighted snippet per step, with the step's emphasized lines baked in.
  const stepViews = await Promise.all(
    STEPS.map(async (s) => {
      const snippet = SNIPPETS[s.snippetId];
      const lines = resolveHighlightLines(snippet.code, s.highlight);
      return { label: snippet.label, html: await highlightToHtml(snippet.code, snippet.lang, lines) };
    })
  );

  const liveEnabled = isLiveConfigured();

  return <Walkthrough stepViews={stepViews} liveEnabled={liveEnabled} />;
}
