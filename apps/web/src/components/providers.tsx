"use client";

import { type ReactNode, useEffect, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getConfig } from "@/wagmi/config";

type InjectedEmitter = { setMaxListeners?: (n: number) => void; providers?: InjectedEmitter[] };

export function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  // Injected wallet providers use an EventEmitter with a low default cap (10).
  // wagmi's reconnect and EIP-6963 discovery add several connect/accountsChanged
  // listeners, tripping a noisy MaxListenersExceededWarning. Raise the cap; this
  // changes no behavior, it only silences the console warning.
  useEffect(() => {
    const eth = (globalThis as { ethereum?: InjectedEmitter }).ethereum;
    if (!eth) return;
    for (const provider of [eth, ...(eth.providers ?? [])]) {
      provider.setMaxListeners?.(100);
    }
  }, []);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
