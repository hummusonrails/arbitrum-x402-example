import type { PaymentPayload, PaymentRequirements, SettleResponse, VerifyResponse } from "@x402/core/types";
import { ARBITRUM_ONE } from "./networks.js";
import { mintCdpJwt } from "./cdp-jwt.js";
import type { MerchantConfig } from "./x402.js";

// shape of @x402/core verifyrequest / settlerequest
interface FacilitatorRequest {
  x402Version: number;
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

async function callFacilitator<T>(
  path: "verify" | "settle",
  config: MerchantConfig,
  body: FacilitatorRequest
): Promise<T> {
  const url = `${ARBITRUM_ONE.cdpFacilitatorUrl}/${path}`;
  const jwt = mintCdpJwt({
    apiKeyId: config.cdpApiKeyId,
    privateKeyPem: config.cdpPrivateKey,
    method: "POST",
    url,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`CDP facilitator /${path} returned ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export function verifyPayment(
  config: MerchantConfig,
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements
): Promise<VerifyResponse> {
  return callFacilitator<VerifyResponse>("verify", config, {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  });
}

export function settlePayment(
  config: MerchantConfig,
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements
): Promise<SettleResponse> {
  return callFacilitator<SettleResponse>("settle", config, {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  });
}
