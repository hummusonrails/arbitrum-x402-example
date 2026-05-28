export const ARBITRUM_ONE = {
  chainId: 42161,
  network: "eip155:42161",
  usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  // eip-712 domain the buyer signs the usdc authorization over
  usdcEip712: { name: "USD Coin", version: "2" },
  arbiscanTxBase: "https://arbiscan.io/tx/",
  cdpFacilitatorUrl: "https://api.cdp.coinbase.com/platform/v2/x402",
} as const;
