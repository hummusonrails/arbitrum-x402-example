"use client";

import { motion, useReducedMotion } from "motion/react";
import { baseUnitsToUsdc, formatUsd } from "@/lib/format";
import type { Fixture } from "@/fixtures/replay";

function Party({
  label,
  delta,
  before,
  after,
  positive,
}: {
  label: string;
  delta: string;
  before: string;
  after: string;
  positive: boolean;
}) {
  return (
    <div className="flex-1 border border-line bg-surface/60 p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-arb-blue-soft">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${positive ? "text-arb-blue" : "text-white"}`}>
        {positive ? "+" : ""}
        {formatUsd(delta)}
      </div>
      <div className="mt-2 space-y-0.5 font-mono text-[11px] text-arb-blue-soft/70">
        <div>before {baseUnitsToUsdc(before).toLocaleString("en-US", { maximumFractionDigits: 6 })}</div>
        <div className="text-white/90">
          after {baseUnitsToUsdc(after).toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC
        </div>
      </div>
    </div>
  );
}

export function BalanceDelta({ fixture }: { fixture: Fixture }) {
  const b = fixture.balances;
  const reduce = useReducedMotion();

  return (
    <div className="space-y-3">
      <div className="relative flex items-stretch gap-3">
        <Party label="buyer" delta={b.buyerDelta} before={b.buyerBefore} after={b.buyerAfter} positive={false} />

        {/* Transfer indicator: the exact amount moving buyer -> payee. */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="relative h-px w-10 bg-line">
            <motion.span
              className="absolute -top-1 h-2 w-2 bg-arb-blue"
              initial={{ left: 0 }}
              animate={reduce ? { left: "100%" } : { left: ["0%", "100%"] }}
              transition={reduce ? {} : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          </div>
          <div className="mt-2 whitespace-nowrap font-mono text-[11px] text-arb-blue">
            {formatUsd(fixture.priceUsdc)}
          </div>
        </div>

        <Party label="payee" delta={b.recipientDelta} before={b.recipientBefore} after={b.recipientAfter} positive />
      </div>
      <p className="text-xs text-arb-blue-soft/70">
        Captured from a real settlement: exactly {formatUsd(fixture.priceUsdc)} moved from buyer to payee in one transfer. Identifiers are placeholders; the amounts are real.
      </p>
    </div>
  );
}
