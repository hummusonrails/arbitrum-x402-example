"use client";

import { formatUnixTime, formatUsd, shortHex } from "@/lib/format";
import type { Authorization } from "@/fixtures/replay";

export function Eip3009Fields({ auth }: { auth: Authorization }) {
  const fields: { label: string; value: string; note: string }[] = [
    { label: "from", value: shortHex(auth.from, 10, 8), note: "Buyer. Funds leave here." },
    { label: "to", value: shortHex(auth.to, 10, 8), note: "Payee. The merchant's address." },
    { label: "value", value: `${auth.value}  (${formatUsd(auth.value)})`, note: "Amount in USDC base units." },
    { label: "validAfter", value: formatUnixTime(auth.validAfter), note: "Not redeemable before this." },
    { label: "validBefore", value: formatUnixTime(auth.validBefore), note: "Expires after this (replay window)." },
    { label: "nonce", value: shortHex(auth.nonce, 12, 8), note: "One-time value; the token marks it used." },
  ];

  return (
    <div className="border border-line bg-surface/60">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-arb-blue-soft">
          TransferWithAuthorization
        </span>
        <span className="font-mono text-[11px] text-arb-blue-soft/70">EIP-712 typed data</span>
      </div>
      <dl className="divide-y divide-line/60">
        {fields.map((f) => (
          <div key={f.label} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
            <dt className="font-mono text-xs text-arb-blue">{f.label}</dt>
            <dd>
              <div className="font-mono text-sm text-white">{f.value}</div>
              <div className="text-xs text-arb-blue-soft/70">{f.note}</div>
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line px-4 py-2 text-xs text-arb-blue-soft/80">
        domain: USD Coin · v2 · chainId 42161 · USDC contract
      </div>
    </div>
  );
}
