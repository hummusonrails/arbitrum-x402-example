"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { WireChannel, WireEvent, WireTone } from "@/lib/wire";
import { prettyJson } from "@/lib/format";
import { cn } from "@/lib/cn";

const CHANNEL_LABEL: Record<WireChannel, string> = {
  buyer: "BUYER",
  merchant: "MERCHANT",
  facilitator: "CDP",
  chain: "CHAIN",
};

const TONE_DOT: Record<WireTone, string> = {
  info: "bg-arb-blue",
  success: "bg-arb-blue",
  warn: "bg-arb-blue-soft",
  error: "bg-red-400",
};

function StatusPill({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      className={cn(
        "border px-1.5 py-0.5 font-mono text-[10px]",
        ok ? "border-arb-blue/50 text-arb-blue" : "border-arb-blue-soft/50 text-arb-blue-soft"
      )}
    >
      {status}
    </span>
  );
}

function ConsoleEvent({ event }: { event: WireEvent }) {
  const [open, setOpen] = useState(false);
  const tone = event.tone ?? "info";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="border-l-2 border-line pl-3"
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5", TONE_DOT[tone])} aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-widest text-arb-blue-soft/70">
          {CHANNEL_LABEL[event.channel]}
        </span>
        {typeof event.status === "number" && <StatusPill status={event.status} />}
      </div>
      <div className="mt-1 font-mono text-sm text-white">{event.title}</div>
      {event.detail && <p className="mt-0.5 text-xs text-arb-blue-soft/80">{event.detail}</p>}

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {event.payload !== undefined && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="font-mono text-[11px] text-arb-blue hover:underline"
          >
            {open ? "− hide payload" : "+ payload"}
          </button>
        )}
        {event.link && (
          <a
            href={event.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-arb-blue hover:underline"
          >
            {event.link.label} ↗
          </a>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && event.payload !== undefined && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 max-h-64 overflow-auto border border-line bg-navy-deep p-3 font-mono text-[11px] leading-relaxed text-arb-blue-soft"
          >
            {prettyJson(event.payload)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function Console({ events }: { events: WireEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="flex min-h-0 flex-col border border-line bg-surface/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-arb-blue-soft">
          live console · wire traffic
        </span>
        <span className="font-mono text-[11px] text-arb-blue-soft/60">{events.length} events</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {events.length === 0 ? (
          <p className="font-mono text-xs text-arb-blue-soft/60">
            Advance the lesson to stream requests and responses here.
          </p>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {events.map((e) => (
                <ConsoleEvent key={e.id} event={e} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
