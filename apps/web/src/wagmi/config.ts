import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [arbitrum],
    connectors: [injected()],
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    transports: {
      [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
