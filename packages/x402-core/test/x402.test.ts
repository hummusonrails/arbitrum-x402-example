import { describe, it, expect } from "vitest";
import { buildRequirements, buildPaymentRequired, type MerchantConfig } from "../src/x402";
import { ARBITRUM_ONE } from "../src/networks";

const config: MerchantConfig = {
  recipientAddress: "0x1111111111111111111111111111111111111111",
  priceUsdc: "10000",
  cdpApiKeyId: "id",
  cdpPrivateKey: "key",
};

describe("buildRequirements", () => {
  it("describes an exact USDC payment on Arbitrum One", () => {
    const r = buildRequirements(config);
    expect(r.scheme).toBe("exact");
    expect(r.network).toBe(ARBITRUM_ONE.network);
    expect(r.asset).toBe(ARBITRUM_ONE.usdc);
    expect(r.amount).toBe("10000");
    expect(r.payTo).toBe(config.recipientAddress);
    expect(r.maxTimeoutSeconds).toBe(300);
    expect(r.extra).toEqual(ARBITRUM_ONE.usdcEip712);
  });
});

describe("buildPaymentRequired", () => {
  it("wraps a single requirement with x402 v2 resource metadata", () => {
    const url = "http://localhost:4021/report";
    const pr = buildPaymentRequired(config, url);
    expect(pr.x402Version).toBe(2);
    expect(pr.resource.url).toBe(url);
    expect(pr.resource.mimeType).toBe("application/json");
    expect(pr.accepts).toHaveLength(1);
    expect(pr.accepts[0]).toEqual(buildRequirements(config));
  });
});
