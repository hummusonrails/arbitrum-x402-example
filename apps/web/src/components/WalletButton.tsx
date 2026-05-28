"use client";

import { useConnect, useConnection, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { shortHex } from "@/lib/format";
import { useMounted } from "@/hooks/useMounted";

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected } = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (!mounted) return <div className="h-9 w-36" aria-hidden />;

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect.mutate()}
        className="border border-line bg-surface px-3 py-1.5 font-mono text-xs text-white transition-colors hover:border-arb-blue"
      >
        <span className="text-arb-blue">●</span> {shortHex(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => connect.mutate({ connector: injected() })}
      disabled={connect.isPending}
      className="border border-arb-blue/60 bg-arb-blue/10 px-3 py-1.5 font-mono text-xs text-arb-blue transition-colors hover:bg-arb-blue/20 disabled:opacity-50"
    >
      {connect.isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
