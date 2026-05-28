"use client";

import { useEffect, useRef } from "react";

// Renders Shiki HTML with the active step's lines already emphasized server-side
// (class "highlighted"). Only scrolls the first emphasized line into view.
export function CodeSnippet({ label, html }: { label: string; html: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const first = container.querySelector<HTMLElement>(".line.highlighted");
    if (first) {
      const target = first.offsetTop - container.clientHeight / 2 + first.clientHeight;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    } else {
      container.scrollTo({ top: 0 });
    }
  }, [html]);

  return (
    <div className="flex min-h-0 flex-col border border-line bg-navy-deep">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 bg-line" />
          <span className="h-2 w-2 bg-line" />
          <span className="h-2 w-2 bg-arb-blue/60" />
        </span>
        <span className="font-mono text-[11px] text-arb-blue-soft">{label}</span>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto py-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
