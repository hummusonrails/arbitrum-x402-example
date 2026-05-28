"use client";

import { cn } from "@/lib/cn";
import { STEPS } from "@/content/lesson";

export function StepRail({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (n: number) => void;
}) {
  return (
    <nav aria-label="Lesson steps" className="border-b border-line bg-surface/30">
      <ol className="flex">
        {STEPS.map((s) => {
          const state = s.n === active ? "active" : s.n < active ? "done" : "todo";
          return (
            <li key={s.n} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(s.n)}
                aria-current={state === "active" ? "step" : undefined}
                className={cn(
                  "group relative flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors",
                  state === "todo" && "hover:bg-surface/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-xs",
                    state === "active" && "border-arb-blue bg-arb-blue text-navy-deep",
                    state === "done" && "border-arb-blue/60 text-arb-blue",
                    state === "todo" && "border-line text-arb-blue-soft/60"
                  )}
                >
                  {state === "done" ? "✓" : s.n}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span
                    className={cn(
                      "block truncate text-xs font-medium",
                      state === "active" ? "text-white" : "text-arb-blue-soft/80"
                    )}
                  >
                    {s.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5 transition-colors",
                    state === "active" ? "bg-arb-blue" : "bg-transparent"
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
