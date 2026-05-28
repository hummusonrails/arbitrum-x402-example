"use client";

import { cn } from "@/lib/cn";

export type Mode = "replay" | "live";

export function ModeToggle({
  mode,
  onChange,
  liveEnabled,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  liveEnabled: boolean;
}) {
  return (
    <div className="inline-flex border border-line" role="tablist" aria-label="Walkthrough mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "replay"}
        onClick={() => onChange("replay")}
        className={cn(
          "px-3 py-1.5 font-mono text-xs transition-colors",
          mode === "replay" ? "bg-arb-blue text-navy-deep" : "text-arb-blue-soft hover:text-white"
        )}
      >
        Replay
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "live"}
        disabled={!liveEnabled}
        onClick={() => onChange("live")}
        title={
          liveEnabled
            ? "Pay with a connected wallet (real ~$0.01)"
            : "Live mode runs locally. Clone the repo and add CDP keys to enable it."
        }
        className={cn(
          "border-l border-line px-3 py-1.5 font-mono text-xs transition-colors",
          mode === "live" ? "bg-arb-blue text-navy-deep" : "text-arb-blue-soft hover:text-white",
          !liveEnabled && "cursor-not-allowed opacity-40 hover:text-arb-blue-soft"
        )}
      >
        Live
      </button>
    </div>
  );
}
