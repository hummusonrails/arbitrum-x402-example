import raw from "./replay.json";
import type { WireEvent } from "@/lib/wire";

export interface Requirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: { name: string; version: string };
}

export interface Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface Fixture {
  network: string;
  asset: string;
  priceUsdc: string;
  settled: boolean;
  paymentRequired: {
    x402Version: number;
    resource: { url: string; description: string; mimeType: string; serviceName: string };
    accepts: Requirements[];
  };
  typedData: {
    domain: { name: string; version: string; chainId: number; verifyingContract: string };
    types: Record<string, { name: string; type: string }[]>;
    primaryType: string;
    message: Authorization;
  };
  paymentPayload: {
    x402Version: number;
    payload: { authorization: Authorization; signature: string };
    resource: unknown;
    accepted: Requirements;
  };
  verify: { request: unknown; response: { isValid: boolean; payer: string } };
  settle: {
    request: unknown;
    response: { network: string; payer: string; success: boolean; transaction: string };
  };
  finalStatus: number;
  finalBody: {
    resource: string;
    asOf: string;
    requestId: string;
    payload: Record<string, number>;
    _payment: { txHash: string; network: string; arbiscan: string };
  };
  settlement: { network: string; payer: string; success: boolean; transaction: string };
  balances: {
    buyerBefore: string;
    buyerAfter: string;
    recipientBefore: string;
    recipientAfter: string;
    buyerDelta: string;
    recipientDelta: string;
  };
  paymentRequiredHeader: string;
}

export const fixture = raw as Fixture;

// The replay X-ray: the full sequence including the verify/settle internals a real
// buyer never sees (live mode only shows the buyer's-eye view).
export function buildReplayEvents(f: Fixture): WireEvent[] {
  const arbiscan = f.finalBody._payment.arbiscan;
  return [
    {
      id: "r1",
      step: 1,
      channel: "buyer",
      title: "GET /report",
      detail: "The buyer requests the gated resource with no payment attached.",
      tone: "info",
    },
    {
      id: "r2",
      step: 1,
      channel: "merchant",
      title: "402 Payment Required",
      detail: "The merchant answers with its price, asset, and payee in accepts[].",
      payload: f.paymentRequired,
      status: 402,
      tone: "warn",
    },
    {
      id: "r3",
      step: 2,
      channel: "buyer",
      title: "Build EIP-3009 authorization",
      detail: "The buyer assembles transferWithAuthorization over the USDC EIP-712 domain.",
      payload: f.typedData,
      tone: "info",
    },
    {
      id: "r4",
      step: 2,
      channel: "buyer",
      title: "Sign typed data",
      detail: "The wallet signs. No gas, no transaction, just an off-chain signature.",
      payload: { signature: f.paymentPayload.payload.signature },
      tone: "info",
    },
    {
      id: "r5",
      step: 3,
      channel: "buyer",
      title: "GET /report + PAYMENT-SIGNATURE",
      detail: "The signed payload is replayed to the merchant.",
      payload: f.paymentPayload,
      tone: "info",
    },
    {
      id: "r6",
      step: 3,
      channel: "merchant",
      title: "POST /verify (JWT-authed)",
      detail: "The merchant mints a 2-minute CDP JWT and asks the facilitator to validate.",
      payload: f.verify.request,
      tone: "info",
    },
    {
      id: "r7",
      step: 3,
      channel: "facilitator",
      title: "verify → isValid",
      detail: "The facilitator confirms the signature and the buyer's balance.",
      payload: f.verify.response,
      tone: "success",
    },
    {
      id: "r8",
      step: 4,
      channel: "merchant",
      title: "POST /settle (JWT-authed)",
      detail: "The merchant asks the facilitator to broadcast the authorized transfer.",
      payload: f.settle.request,
      tone: "info",
    },
    {
      id: "r9",
      step: 4,
      channel: "facilitator",
      title: "settle → submitted",
      detail: "The facilitator submits transferWithAuthorization and pays the gas.",
      payload: f.settle.response,
      tone: "info",
    },
    {
      id: "r10",
      step: 4,
      channel: "chain",
      title: "Settled on Arbitrum One",
      detail: "USDC moves from buyer to payee in a single on-chain transfer.",
      tone: "success",
      link: { label: "View on Arbiscan", href: arbiscan },
    },
    {
      id: "r11",
      step: 5,
      channel: "merchant",
      title: "200 OK · gated content unlocked",
      detail: "Payment proven, the premium JSON is returned with the settlement header.",
      payload: f.finalBody,
      status: 200,
      tone: "success",
    },
  ];
}
