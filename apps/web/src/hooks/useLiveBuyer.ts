"use client";

import { useCallback, useRef, useState } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { ExactEvmScheme, type ClientEvmSigner } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ARBITRUM_ONE } from "@x402-arbitrum/core";
import type { WireEvent } from "@/lib/wire";

const RESOURCE_PATH = "/api/merchant/report";

export type LiveStatus = "idle" | "running" | "success" | "error";

export interface LiveResult {
  status: LiveStatus;
  events: WireEvent[];
  error?: string;
  run: () => Promise<void>;
  reset: () => void;
}

// Drives a real x402 payment from the connected wallet and emits console events
// reflecting exactly what the buyer observes: the 402, the EIP-3009 signature it
// produces, and the settled 200. Verify/settle run server-side in the merchant route.
export function useLiveBuyer(): LiveResult {
  const { address } = useConnection();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [events, setEvents] = useState<WireEvent[]>([]);
  const [error, setError] = useState<string>();
  const seq = useRef(0);

  const emit = useCallback((e: Omit<WireEvent, "id">) => {
    seq.current += 1;
    setEvents((prev) => [...prev, { ...e, id: `live-${seq.current}` }]);
  }, []);

  const reset = useCallback(() => {
    seq.current = 0;
    setEvents([]);
    setError(undefined);
    setStatus("idle");
  }, []);

  const run = useCallback(async () => {
    if (!walletClient || !address) {
      setError("Connect a wallet first.");
      setStatus("error");
      return;
    }
    reset();
    setStatus("running");

    const signer: ClientEvmSigner = {
      address,
      signTypedData: async (message) => {
        emit({
          step: 2,
          channel: "buyer",
          title: "Sign EIP-3009 transferWithAuthorization",
          detail: "Your wallet signs the USDC authorization. No gas, no transaction yet.",
          payload: message,
          tone: "info",
        });
        return walletClient.signTypedData({
          account: walletClient.account,
          domain: message.domain,
          types: message.types,
          primaryType: message.primaryType,
          message: message.message,
        } as Parameters<typeof walletClient.signTypedData>[0]);
      },
    };

    const client = new x402Client().register(ARBITRUM_ONE.network, new ExactEvmScheme(signer));

    let sawChallenge = false;
    const capturingFetch: typeof fetch = async (input, init) => {
      const res = await fetch(input, init);
      const paymentSignature = new Headers(init?.headers).get("payment-signature");

      if (res.status === 402 && !sawChallenge) {
        sawChallenge = true;
        emit({
          step: 1,
          channel: "merchant",
          title: "GET /report → 402 Payment Required",
          detail: "The merchant advertises price, asset, and payee in the accepts[] offer.",
          payload: await res.clone().json(),
          status: 402,
          tone: "warn",
        });
      } else if (paymentSignature) {
        emit({
          step: 3,
          channel: "buyer",
          title: "GET /report + PAYMENT-SIGNATURE",
          detail: "The signed authorization is replayed to the merchant, which verifies and settles via CDP.",
          status: res.status,
          tone: "info",
        });
      }
      return res;
    };

    const paidFetch = wrapFetchWithPayment(capturingFetch, client);

    try {
      const response = await paidFetch(new URL(RESOURCE_PATH, window.location.origin).toString());
      const body = await response.json();

      if (!response.ok) {
        emit({
          step: 5,
          channel: "merchant",
          title: `Request failed (${response.status})`,
          detail: typeof body?.error === "string" ? body.error : "See payload for details.",
          payload: body,
          status: response.status,
          tone: "error",
        });
        setError(typeof body?.error === "string" ? body.error : `HTTP ${response.status}`);
        setStatus("error");
        return;
      }

      const settleHeader = response.headers.get("x-payment-response");
      const settlement = settleHeader ? decodePaymentResponseHeader(settleHeader) : undefined;
      const txHash = settlement?.transaction;

      if (txHash) {
        emit({
          step: 4,
          channel: "chain",
          title: "Settled on Arbitrum One",
          detail: "The facilitator submitted transferWithAuthorization and USDC moved on-chain.",
          tone: "success",
          link: { label: "View on Arbiscan", href: `${ARBITRUM_ONE.arbiscanTxBase}${txHash}` },
        });
      }

      emit({
        step: 5,
        channel: "merchant",
        title: "200 OK · gated content unlocked",
        detail: "Payment proven, the premium JSON is returned to the buyer.",
        payload: body,
        status: 200,
        tone: "success",
      });
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emit({ step: 5, channel: "buyer", title: "Error", detail: message, tone: "error" });
      setError(message);
      setStatus("error");
    }
  }, [address, walletClient, emit, reset]);

  return { status, events, error, run, reset };
}
