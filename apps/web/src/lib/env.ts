// Server-only. Never import this from a client component; it reads CDP secrets.
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import type { MerchantConfig } from "@x402-arbitrum/core";

// Single source of truth: the monorepo root .env (two levels up from apps/web at runtime).
loadDotenv({ path: resolve(process.cwd(), "../../.env") });

export function getMerchantConfig(): MerchantConfig {
  return {
    recipientAddress: process.env.RECIPIENT_ADDRESS ?? "",
    priceUsdc: process.env.PRICE_USDC ?? "10000",
    cdpApiKeyId: process.env.CDP_API_KEY_ID ?? "",
    cdpPrivateKey: process.env.CDP_PRIVATE_KEY ?? "",
  };
}

// Live settlement needs a payee and CDP credentials. Replay mode needs none of this.
export function isLiveConfigured(): boolean {
  const c = getMerchantConfig();
  return Boolean(c.recipientAddress && c.cdpApiKeyId && c.cdpPrivateKey);
}
