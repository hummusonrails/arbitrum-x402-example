// Resolve which lines to emphasize from code substrings, so highlights track the
// real source instead of brittle hardcoded line numbers.
export function resolveHighlightLines(code: string, needles: readonly string[]): number[] {
  const lines = code.split("\n");
  const result = new Set<number>();
  for (const needle of needles) {
    lines.forEach((line, i) => {
      if (line.includes(needle)) result.add(i + 1); // 1-based for the rendered <span class="line">
    });
  }
  return [...result].sort((a, b) => a - b);
}
