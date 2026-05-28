"use client";

import { motion, useReducedMotion } from "motion/react";
import type { WireChannel } from "@/lib/wire";

const NODES: { channel: WireChannel; label: string; sub: string; x: number }[] = [
  { channel: "buyer", label: "Buyer", sub: "wallet", x: 70 },
  { channel: "merchant", label: "Merchant", sub: "402 handler", x: 250 },
  { channel: "facilitator", label: "CDP", sub: "facilitator", x: 430 },
  { channel: "chain", label: "Arbitrum One", sub: "USDC", x: 610 },
];
const NODE_W = 110;
const NODE_H = 54;
const CY = 70;

export function FlowDiagram({ active }: { active: WireChannel[] }) {
  const reduce = useReducedMotion();
  const isActive = (c: WireChannel) => active.includes(c);

  return (
    <svg viewBox="0 0 720 140" className="w-full" role="img" aria-label="x402 payment flow: buyer, merchant, CDP facilitator, Arbitrum One">
      {NODES.slice(0, -1).map((n, i) => {
        const next = NODES[i + 1]!;
        const on = isActive(n.channel) && isActive(next.channel);
        const x1 = n.x + NODE_W / 2;
        const x2 = next.x - NODE_W / 2;
        return (
          <g key={`edge-${i}`}>
            <line x1={x1} y1={CY} x2={x2} y2={CY} stroke="#3b4a63" strokeWidth={2} />
            {on && (
              <motion.line
                x1={x1}
                y1={CY}
                x2={x2}
                y2={CY}
                stroke="#12AAFF"
                strokeWidth={2}
                strokeDasharray="6 8"
                initial={{ strokeDashoffset: 0 }}
                animate={reduce ? { strokeDashoffset: 0 } : { strokeDashoffset: -28 }}
                transition={reduce ? {} : { duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            )}
          </g>
        );
      })}

      {NODES.map((n) => {
        const on = isActive(n.channel);
        return (
          <motion.g
            key={n.channel}
            initial={false}
            animate={{ opacity: on ? 1 : 0.45 }}
            transition={{ duration: 0.3 }}
          >
            <rect
              x={n.x - NODE_W / 2}
              y={CY - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              fill={on ? "#2d364d" : "#1a2636"}
              stroke={on ? "#12AAFF" : "#3b4a63"}
              strokeWidth={on ? 2 : 1}
            />
            <text x={n.x} y={CY - 4} textAnchor="middle" fill="#ffffff" fontSize={13} fontWeight={600}>
              {n.label}
            </text>
            <text x={n.x} y={CY + 14} textAnchor="middle" fill="#9DCCED" fontSize={10}>
              {n.sub}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
