"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { STEPS } from "@/content/lesson";
import { buildReplayEvents, fixture } from "@/fixtures/replay";
import { Header } from "@/components/Header";
import { StepRail } from "@/components/StepRail";
import { LessonPanel } from "@/components/LessonPanel";
import { Console } from "@/components/Console";
import { useLiveBuyer } from "@/hooks/useLiveBuyer";
import { useMounted } from "@/hooks/useMounted";
import type { Mode } from "@/components/ModeToggle";
import { cn } from "@/lib/cn";

const ARBITRUM_CHAIN_ID = 42161;
const REPO_URL = "https://github.com/hummusonrails/arbitrum-x402-example";

export function Walkthrough({
  stepViews,
  liveEnabled,
}: {
  stepViews: { label: string; html: string }[];
  liveEnabled: boolean;
}) {
  const [mode, setMode] = useState<Mode>("replay");
  const [activeStep, setActiveStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [mobileTab, setMobileTab] = useState<"lesson" | "console">("lesson");

  const mounted = useMounted();
  const { isConnected, chainId } = useConnection();
  const live = useLiveBuyer();

  const replayEvents = useMemo(() => buildReplayEvents(fixture), []);
  const visibleEvents =
    mode === "live" ? live.events : replayEvents.filter((e) => e.step <= activeStep);

  // In live mode, the lesson tracks the latest streamed event.
  useEffect(() => {
    if (mode !== "live") return;
    const last = live.events[live.events.length - 1];
    if (last) setActiveStep(last.step);
  }, [mode, live.events]);

  // Replay auto-advance.
  useEffect(() => {
    if (!playing || mode !== "replay") return;
    if (activeStep >= STEPS.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((s) => Math.min(STEPS.length, s + 1)), 2600);
    return () => clearTimeout(t);
  }, [playing, activeStep, mode]);

  function changeMode(m: Mode) {
    setMode(m);
    setActiveStep(1);
    setPlaying(false);
    if (m === "replay") live.reset();
  }

  const step = STEPS[activeStep - 1]!;
  const snippet = stepViews[activeStep - 1];
  const liveRunning = live.status === "running";

  return (
    <div className="flex h-dvh flex-col">
      <Header mode={mode} onModeChange={changeMode} liveEnabled={liveEnabled} />
      <StepRail active={activeStep} onSelect={(n) => mode === "replay" && setActiveStep(n)} />

      {/* Mobile tab switch */}
      <div className="flex border-b border-line lg:hidden" role="tablist" aria-label="Panel">
        {(["lesson", "console"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={mobileTab === t}
            onClick={() => setMobileTab(t)}
            className={cn(
              "flex-1 py-2 font-mono text-xs uppercase tracking-widest",
              mobileTab === t ? "bg-surface text-arb-blue" : "text-arb-blue-soft/70"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="grid min-h-0 flex-1 lg:grid-cols-2">
        {/* Lesson */}
        <section
          className={cn(
            "min-h-0 overflow-auto border-line p-5 lg:border-r",
            mobileTab === "console" && "hidden lg:block"
          )}
        >
          {snippet && <LessonPanel step={step} snippet={snippet} fixture={fixture} />}

          {mode === "replay" && (
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                disabled={activeStep === 1}
                className="border border-line px-3 py-1.5 font-mono text-xs text-arb-blue-soft transition-colors hover:border-arb-blue disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="border border-arb-blue/50 bg-arb-blue/10 px-3 py-1.5 font-mono text-xs text-arb-blue transition-colors hover:bg-arb-blue/20"
              >
                {playing ? "❚❚ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((s) => Math.min(STEPS.length, s + 1))}
                disabled={activeStep === STEPS.length}
                className="border border-line px-3 py-1.5 font-mono text-xs text-white transition-colors hover:border-arb-blue disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </section>

        {/* Console */}
        <section
          className={cn(
            "flex min-h-0 flex-col gap-3 p-5",
            mobileTab === "lesson" && "hidden lg:flex"
          )}
        >
          {!liveEnabled && (
            <div className="border border-arb-blue/30 bg-surface/40 p-3 text-xs leading-relaxed text-arb-blue-soft">
              <span className="font-mono uppercase tracking-widest text-arb-blue">Replay only</span> on this
              hosted demo. Live mode signs with your wallet and settles real USDC, so it needs CDP keys and runs
              locally.{" "}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-arb-blue underline underline-offset-2 hover:text-arb-blue-soft"
              >
                Clone the repo to try it →
              </a>
            </div>
          )}

          {mode === "live" && (
            <div className="border border-line bg-surface/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-arb-blue-soft">
                  Real payment · settles ~$0.01 USDC on Arbitrum One
                </span>
                <button
                  type="button"
                  onClick={() => live.run()}
                  disabled={!mounted || !isConnected || liveRunning}
                  className="bg-arb-blue px-3 py-1.5 font-mono text-xs font-semibold text-navy-deep transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {liveRunning ? "Running…" : "Run live payment"}
                </button>
              </div>
              {mounted && !isConnected && (
                <p className="mt-2 font-mono text-[11px] text-arb-blue-soft/70">
                  Connect a wallet (top right) holding USDC on Arbitrum One to run.
                </p>
              )}
              {mounted && isConnected && chainId !== ARBITRUM_CHAIN_ID && (
                <p className="mt-2 font-mono text-[11px] text-arb-blue-soft/70">
                  Your wallet is on chain {chainId}. The signature targets Arbitrum One (42161); your wallet may prompt you to confirm.
                </p>
              )}
              {live.error && (
                <p className="mt-2 font-mono text-[11px] text-red-400">{live.error}</p>
              )}
            </div>
          )}
          <Console events={visibleEvents} />
        </section>
      </main>
    </div>
  );
}
