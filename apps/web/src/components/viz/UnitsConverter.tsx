"use client";

import { useState } from "react";
import { baseUnitsToUsdc, formatUsd } from "@/lib/format";

// Shows how USDC base units (6 decimals) map to dollars, interactively.
export function UnitsConverter({ defaultBaseUnits }: { defaultBaseUnits: string }) {
  const [units, setUnits] = useState(defaultBaseUnits);
  const numeric = /^\d+$/.test(units) ? units : "0";

  return (
    <div className="border border-line bg-surface/60 p-4">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-arb-blue-soft">
        base units → dollars
      </div>
      <div className="flex items-center gap-3">
        <input
          inputMode="numeric"
          value={units}
          onChange={(e) => setUnits(e.target.value.replace(/[^\d]/g, ""))}
          aria-label="USDC amount in base units"
          className="w-36 border border-line bg-navy-deep px-3 py-2 font-mono text-sm text-white outline-none focus:border-arb-blue"
        />
        <span className="font-mono text-sm text-arb-blue-soft">base units</span>
        <span className="text-arb-blue-soft">=</span>
        <span className="font-mono text-lg font-semibold text-arb-blue">{formatUsd(numeric)}</span>
      </div>
      <p className="mt-3 text-xs text-arb-blue-soft/80">
        USDC has 6 decimals, so {Number(numeric).toLocaleString()} base units ={" "}
        {baseUnitsToUsdc(numeric).toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC.
      </p>
    </div>
  );
}
