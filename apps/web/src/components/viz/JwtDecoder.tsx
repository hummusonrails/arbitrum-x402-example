"use client";

import { JWT_SAMPLE } from "@/content/lesson";

function Segment({
  color,
  title,
  entries,
}: {
  color: string;
  title: string;
  entries: [string, string][];
}) {
  return (
    <div className="border border-line bg-surface/60">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="h-2 w-2" style={{ backgroundColor: color }} aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
          {title}
        </span>
      </div>
      <dl className="divide-y divide-line/60">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-2">
            <dt className="font-mono text-xs text-arb-blue-soft">{k}</dt>
            <dd className="break-all font-mono text-xs text-white">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function JwtDecoder() {
  const header = Object.entries(JWT_SAMPLE.header).map(
    ([k, v]) => [k, String(v)] as [string, string]
  );
  const payload = Object.entries(JWT_SAMPLE.payload).map(
    ([k, v]) => [k, Array.isArray(v) ? `[${v.join(", ")}]` : String(v)] as [string, string]
  );

  return (
    <div className="space-y-3">
      <div className="font-mono text-[11px] text-arb-blue-soft/80">
        <span style={{ color: "#12AAFF" }}>header</span>.
        <span style={{ color: "#9DCCED" }}>payload</span>.
        <span style={{ color: "#6b7a99" }}>signature</span>
      </div>
      <Segment color="#12AAFF" title="header" entries={header} />
      <Segment color="#9DCCED" title="payload (claims)" entries={payload} />
      <p className="text-xs text-arb-blue-soft/70">
        Minted fresh per request, bound to the method + URI, and expired after 120 seconds, so a captured token cannot be replayed elsewhere.
      </p>
    </div>
  );
}
