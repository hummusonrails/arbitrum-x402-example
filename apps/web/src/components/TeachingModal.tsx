"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function TeachingModal({
  title,
  body,
  triggerLabel,
}: {
  title: string;
  body: string[];
  triggerLabel: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="border border-arb-blue/50 bg-arb-blue/10 px-3 py-1.5 font-mono text-xs text-arb-blue transition-colors hover:bg-arb-blue/20"
        >
          {triggerLabel}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-navy-deep/80 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-auto border border-arb-blue/40 bg-surface p-6 shadow-2xl">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-arb-blue">
            deep dive
          </div>
          <Dialog.Title className="text-2xl font-bold tracking-tight text-white">
            {title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="mt-4 space-y-3">
              {body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-arb-blue-soft">
                  {p}
                </p>
              ))}
            </div>
          </Dialog.Description>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="bg-arb-blue px-4 py-2 text-sm font-semibold text-navy-deep transition-opacity hover:opacity-90"
              >
                Got it
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
