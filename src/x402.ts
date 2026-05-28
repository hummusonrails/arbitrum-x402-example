import type { PaymentRequired, PaymentRequirements } from "@x402/fetch";
import { ARBITRUM_ONE } from "./networks.js";

export interface MerchantConfig {
  recipientAddress: string;
  priceUsdc: string; // base units, 6 decimals ("10000" = $0.01)
  cdpApiKeyId: string;
  cdpPrivateKey: string;
}

export function buildPaymentRequired(config: MerchantConfig, resourceUrl: string): PaymentRequired {
  const requirements: PaymentRequirements = {
    scheme: "exact",
    network: ARBITRUM_ONE.network,
    asset: ARBITRUM_ONE.usdc,
    amount: config.priceUsdc,
    payTo: config.recipientAddress,
    maxTimeoutSeconds: 300,
    extra: ARBITRUM_ONE.usdcEip712,
  };

  return {
    x402Version: 2,
    resource: {
      url: resourceUrl,
      description: "Premium market data snapshot",
      mimeType: "application/json",
      serviceName: "x402-arbitrum-cdp demo merchant",
    },
    accepts: [requirements],
  };
}
