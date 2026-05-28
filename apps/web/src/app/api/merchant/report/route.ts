import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import {
  ARBITRUM_ONE,
  buildPaymentRequired,
  buildRequirements,
  settlePayment,
  verifyPayment,
} from "@x402-arbitrum/core";
import { getMerchantConfig } from "@/lib/env";

// node:crypto (CDP JWT) requires the Node.js runtime, and settlement must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function premiumContent() {
  return {
    resource: "premium-market-data",
    asOf: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    payload: { btc: 71234.56, eth: 4567.89 },
  };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export async function GET(req: Request) {
  const config = getMerchantConfig();
  const resourceUrl = req.url;
  const paymentRequired = buildPaymentRequired(config, resourceUrl);
  const requirements = buildRequirements(config);

  // v2 buyers send payment-signature; v1 used x-payment.
  const paymentHeader =
    req.headers.get("payment-signature") ?? req.headers.get("x-payment");

  if (!paymentHeader) {
    return jsonResponse(paymentRequired, 402, {
      "payment-required": encodePaymentRequiredHeader(paymentRequired),
    });
  }

  let paymentPayload;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentHeader);
  } catch {
    return jsonResponse({ ...paymentRequired, error: "Malformed payment header" }, 402, {
      "payment-required": encodePaymentRequiredHeader(paymentRequired),
    });
  }

  try {
    const verification = await verifyPayment(config, paymentPayload, requirements);
    if (!verification.isValid) {
      return jsonResponse(
        { ...paymentRequired, error: verification.invalidReason ?? "Verification failed" },
        402,
        { "payment-required": encodePaymentRequiredHeader(paymentRequired) }
      );
    }

    const settlement = await settlePayment(config, paymentPayload, requirements);
    if (!settlement.success) {
      return jsonResponse({ error: "Settlement failed", detail: settlement.errorReason }, 502);
    }

    return jsonResponse(
      {
        ...premiumContent(),
        _payment: {
          txHash: settlement.transaction,
          network: settlement.network,
          arbiscan: settlement.transaction
            ? `${ARBITRUM_ONE.arbiscanTxBase}${settlement.transaction}`
            : undefined,
        },
      },
      200,
      {
        "x-payment-response": encodePaymentResponseHeader(settlement),
        "access-control-expose-headers": "X-PAYMENT-RESPONSE",
      }
    );
  } catch (err) {
    return jsonResponse({ error: "Facilitator unavailable", detail: String(err) }, 502);
  }
}
