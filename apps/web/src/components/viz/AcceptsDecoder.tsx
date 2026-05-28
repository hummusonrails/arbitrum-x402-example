"use client";

import { formatUsd, shortHex } from "@/lib/format";
import type { Requirements } from "@/fixtures/replay";

const FIELD_NOTES: Record<string, string> = {
  scheme: "Payment scheme. 'exact' means pay this precise amount.",
  network: "CAIP-2 chain id. eip155:42161 is Arbitrum One.",
  asset: "ERC-20 to pay in: native USDC on Arbitrum.",
  amount: "Price in base units (6 decimals).",
  payTo: "Address that receives the USDC.",
  maxTimeoutSeconds: "How long the offer stays valid.",
};

export function AcceptsDecoder({ requirements }: { requirements: Requirements }) {
  const rows: { label: string; value: string; note: string }[] = [
    { label: "scheme", value: requirements.scheme, note: FIELD_NOTES.scheme! },
    { label: "network", value: requirements.network, note: FIELD_NOTES.network! },
    { label: "asset", value: shortHex(requirements.asset, 10, 8), note: FIELD_NOTES.asset! },
    { label: "amount", value: `${requirements.amount}  (${formatUsd(requirements.amount)})`, note: FIELD_NOTES.amount! },
    { label: "payTo", value: shortHex(requirements.payTo, 10, 8), note: FIELD_NOTES.payTo! },
    { label: "maxTimeoutSeconds", value: String(requirements.maxTimeoutSeconds), note: FIELD_NOTES.maxTimeoutSeconds! },
  ];

  return (
    <div className="border border-line bg-surface/60">
      <div className="border-b border-line px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-arb-blue-soft">
        accepts[0] · the offer
      </div>
      <dl className="divide-y divide-line/60">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5">
            <dt className="font-mono text-xs text-arb-blue">{r.label}</dt>
            <dd>
              <div className="font-mono text-sm text-white">{r.value}</div>
              <div className="text-xs text-arb-blue-soft/70">{r.note}</div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
