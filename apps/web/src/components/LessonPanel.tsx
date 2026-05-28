"use client";

import { motion } from "motion/react";
import type { LessonStep, VizKind } from "@/content/lesson";
import type { Fixture } from "@/fixtures/replay";
import { FlowDiagram } from "@/components/FlowDiagram";
import { CodeSnippet } from "@/components/CodeSnippet";
import { TeachingModal } from "@/components/TeachingModal";
import { AcceptsDecoder } from "@/components/viz/AcceptsDecoder";
import { UnitsConverter } from "@/components/viz/UnitsConverter";
import { Eip3009Fields } from "@/components/viz/Eip3009Fields";
import { JwtDecoder } from "@/components/viz/JwtDecoder";
import { BalanceDelta } from "@/components/viz/BalanceDelta";

function Viz({ kind, fixture }: { kind: VizKind; fixture: Fixture }) {
  const requirements = fixture.paymentRequired.accepts[0];
  switch (kind) {
    case "accepts":
      return requirements ? <AcceptsDecoder requirements={requirements} /> : null;
    case "units":
      return <UnitsConverter defaultBaseUnits={fixture.priceUsdc} />;
    case "eip3009":
      return <Eip3009Fields auth={fixture.typedData.message} />;
    case "jwt":
      return <JwtDecoder />;
    case "balances":
      return <BalanceDelta fixture={fixture} />;
    default:
      return null;
  }
}

export function LessonPanel({
  step,
  snippet,
  fixture,
}: {
  step: LessonStep;
  snippet: { label: string; html: string };
  fixture: Fixture;
}) {
  return (
    <motion.div
      key={step.n}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-arb-blue">
          Step {step.n} of 5 · {step.tagline}
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{step.title}</h2>
        <div className="mt-3 space-y-2">
          {step.concept.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-arb-blue-soft">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-3">
          <TeachingModal title={step.modal.title} body={step.modal.body} triggerLabel={`Learn more: ${step.modal.title}`} />
        </div>
      </div>

      <FlowDiagram active={step.activeChannels} />

      {step.viz.length > 0 && (
        <div className="space-y-4">
          {step.viz.map((kind) => (
            <Viz key={kind} kind={kind} fixture={fixture} />
          ))}
        </div>
      )}

      <div className="h-80">
        <CodeSnippet label={snippet.label} html={snippet.html} />
      </div>
    </motion.div>
  );
}
