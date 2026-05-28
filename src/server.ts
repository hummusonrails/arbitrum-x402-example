import "dotenv/config";
import express from "express";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { ARBITRUM_ONE } from "./networks.js";
import { buildPaymentRequired, type MerchantConfig } from "./x402.js";
import { settlePayment, verifyPayment } from "./facilitator.js";

const config: MerchantConfig = {
  recipientAddress: process.env.RECIPIENT_ADDRESS ?? "",
  priceUsdc: process.env.PRICE_USDC ?? "10000",
  cdpApiKeyId: process.env.CDP_API_KEY_ID ?? "",
  cdpPrivateKey: process.env.CDP_PRIVATE_KEY ?? "",
};

const PORT = Number(process.env.PORT ?? 4021);

function premiumContent() {
  return {
    resource: "premium-market-data",
    asOf: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    payload: { btc: 71234.56, eth: 4567.89 },
  };
}

const app = express();

app.get("/report", async (req, res) => {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const paymentRequired = buildPaymentRequired(config, resourceUrl);
  const requirements = paymentRequired.accepts[0];

  // v2 buyer uses payment-signature; v1 used x-payment
  const paymentHeader = req.get("payment-signature") ?? req.get("x-payment");

  if (!paymentHeader) {
    // v2 client reads requirements from the payment-required header, not the body
    res.setHeader("payment-required", encodePaymentRequiredHeader(paymentRequired));
    res.status(402).json(paymentRequired);
    return;
  }

  let paymentPayload;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentHeader);
  } catch {
    res.setHeader("payment-required", encodePaymentRequiredHeader(paymentRequired));
    res.status(402).json({ ...paymentRequired, error: "Malformed payment header" });
    return;
  }

  try {
    const verification = await verifyPayment(config, paymentPayload, requirements);
    if (!verification.isValid) {
      res.setHeader("payment-required", encodePaymentRequiredHeader(paymentRequired));
      res
        .status(402)
        .json({ ...paymentRequired, error: verification.invalidReason ?? "Verification failed" });
      return;
    }

    const settlement = await settlePayment(config, paymentPayload, requirements);
    if (!settlement.success) {
      res.status(502).json({ error: "Settlement failed", detail: settlement.errorReason });
      return;
    }

    res.setHeader("x-payment-response", encodePaymentResponseHeader(settlement));
    res.setHeader("access-control-expose-headers", "X-PAYMENT-RESPONSE");
    res.status(200).json({
      ...premiumContent(),
      _payment: {
        txHash: settlement.transaction,
        network: settlement.network,
        arbiscan: settlement.transaction
          ? `${ARBITRUM_ONE.arbiscanTxBase}${settlement.transaction}`
          : undefined,
      },
    });
  } catch (err) {
    res.status(502).json({ error: "Facilitator unavailable", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`x402 merchant listening on http://localhost:${PORT}/report`);
  console.log(`  network:   ${ARBITRUM_ONE.network} (Arbitrum One)`);
  console.log(`  asset:     ${ARBITRUM_ONE.usdc} (USDC)`);
  console.log(`  price:     ${config.priceUsdc} base units`);
  console.log(`  payTo:     ${config.recipientAddress || "(unset, set RECIPIENT_ADDRESS)"}`);
  console.log(`  facilitator: ${ARBITRUM_ONE.cdpFacilitatorUrl}`);
});
