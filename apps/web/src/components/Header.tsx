"use client";

import { ModeToggle, type Mode } from "@/components/ModeToggle";
import { WalletButton } from "@/components/WalletButton";

export function Header({
  mode,
  onModeChange,
  liveEnabled,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  liveEnabled: boolean;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arbitrum-logomark.svg" alt="Arbitrum" className="h-7 w-auto" />
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-white">
            x402 on <span className="text-arb-blue">Arbitrum</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-arb-blue-soft/70">
            interactive walkthrough
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ModeToggle mode={mode} onChange={onModeChange} liveEnabled={liveEnabled} />
        {mode === "live" && <WalletButton />}
      </div>
    </header>
  );
}
