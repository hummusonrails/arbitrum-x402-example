import "./load-env";
import express from "express";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, getAddress, formatUnits } from "viem";
import { arbitrum } from "viem/chains";
import { ExactEvmScheme } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
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
  type MerchantConfig,
} from "@x402-arbitrum/core";

// Captures one real x402 settlement end to end, then writes a SANITIZED fixture
// (identifiers scrubbed to placeholders) for the teaching frontend's replay mode.
// `--no-settle` validates the capture plumbing without spending (stops after verify).

const SETTLE = !process.argv.includes("--no-settle");
const PORT = 4191;
const here = dirname(fileURLToPath(import.meta.url));
const webFixtures = resolve(here, "../../../apps/web/src/fixtures");
const rawDir = resolve(here, "../.capture");

const config: MerchantConfig = {
  recipientAddress: process.env.RECIPIENT_ADDRESS ?? "",
  priceUsdc: process.env.PRICE_USDC ?? "10000",
  cdpApiKeyId: process.env.CDP_API_KEY_ID ?? "",
  cdpPrivateKey: process.env.CDP_PRIVATE_KEY ?? "",
};
const buyerKey = process.env.BUYER_PRIVATE_KEY;
if (!config.recipientAddress || !config.cdpApiKeyId || !config.cdpPrivateKey || !buyerKey) {
  console.error("Missing env. Need RECIPIENT_ADDRESS, CDP_API_KEY_ID, CDP_PRIVATE_KEY, BUYER_PRIVATE_KEY.");
  process.exit(1);
}

type Capture = Record<string, unknown>;
const capture: Capture = { network: ARBITRUM_ONE.network, asset: ARBITRUM_ONE.usdc, priceUsdc: config.priceUsdc, settled: SETTLE };

const erc20 = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;
const pub = createPublicClient({ chain: arbitrum, transport: http() });
const usdc = getAddress(ARBITRUM_ONE.usdc);
const buyer = privateKeyToAccount(buyerKey as `0x${string}`);
const recipient = getAddress(config.recipientAddress as `0x${string}`);

async function usdcBalance(addr: `0x${string}`, blockNumber?: bigint): Promise<bigint> {
  return pub.readContract({ address: usdc, abi: erc20, functionName: "balanceOf", args: [addr], blockNumber });
}

const app = express();
app.get("/report", async (req, res) => {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const paymentRequired = buildPaymentRequired(config, resourceUrl);
  const requirements = buildRequirements(config);
  const paymentHeader = req.get("payment-signature") ?? req.get("x-payment");

  if (!paymentHeader) {
    capture.paymentRequired = paymentRequired;
    res.setHeader("payment-required", encodePaymentRequiredHeader(paymentRequired));
    res.status(402).json(paymentRequired);
    return;
  }

  const paymentPayload = decodePaymentSignatureHeader(paymentHeader);
  capture.paymentPayload = paymentPayload;

  const verification = await verifyPayment(config, paymentPayload, requirements);
  capture.verify = {
    request: { x402Version: 2, paymentPayload, paymentRequirements: requirements },
    response: verification,
  };

  if (!verification.isValid) {
    res.status(402).json({ ...paymentRequired, error: verification.invalidReason });
    return;
  }

  if (!SETTLE) {
    res.status(200).json({ dryRun: true, note: "verify captured; settle skipped" });
    return;
  }

  const settlement = await settlePayment(config, paymentPayload, requirements);
  capture.settle = {
    request: { x402Version: 2, paymentPayload, paymentRequirements: requirements },
    response: settlement,
  };
  res.setHeader("x-payment-response", encodePaymentResponseHeader(settlement));
  res.status(200).json({
    resource: "premium-market-data",
    asOf: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    payload: { btc: 71234.56, eth: 4567.89 },
    _payment: {
      txHash: settlement.transaction,
      network: settlement.network,
      arbiscan: settlement.transaction ? `${ARBITRUM_ONE.arbiscanTxBase}${settlement.transaction}` : undefined,
    },
  });
});

const server = app.listen(PORT);

async function main() {
  const buyerBefore = await usdcBalance(buyer.address);
  const recipientBefore = await usdcBalance(recipient);

  const signer = {
    address: buyer.address,
    signTypedData: (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }) => {
      capture.typedData = message;
      return buyer.signTypedData(message as Parameters<typeof buyer.signTypedData>[0]);
    },
  };

  const client = new x402Client().register(ARBITRUM_ONE.network, new ExactEvmScheme(signer));
  const paidFetch = wrapFetchWithPayment(fetch, client);

  console.log(`Running capture against http://localhost:${PORT}/report (settle=${SETTLE})...`);
  const response = await paidFetch(`http://localhost:${PORT}/report`);
  capture.finalStatus = response.status;
  capture.finalBody = await response.json();
  const xpr = response.headers.get("x-payment-response");
  if (xpr) capture.settlement = decodePaymentResponseHeader(xpr);

  // Confirm the settlement mined. The settled EIP-3009 transfer moves exactly
  // `value` from buyer to recipient, so derive after-balances from that
  // authoritative amount rather than a public-RPC read (which lags per-address).
  const txHash =
    (capture.settlement as { transaction?: `0x${string}` } | undefined)?.transaction ??
    (capture.settle as { response?: { transaction?: `0x${string}` } } | undefined)?.response?.transaction;
  const authValue = (capture.paymentPayload as { payload?: { authorization?: { value?: string } } } | undefined)
    ?.payload?.authorization?.value;
  const value = authValue ? BigInt(authValue) : 0n;

  let buyerAfter: bigint;
  let recipientAfter: bigint;
  if (SETTLE && txHash && value > 0n) {
    await pub.waitForTransactionReceipt({ hash: txHash });
    buyerAfter = buyerBefore - value;
    recipientAfter = recipientBefore + value;
  } else {
    buyerAfter = await usdcBalance(buyer.address);
    recipientAfter = await usdcBalance(recipient);
  }
  capture.balances = {
    buyerBefore: buyerBefore.toString(),
    buyerAfter: buyerAfter.toString(),
    recipientBefore: recipientBefore.toString(),
    recipientAfter: recipientAfter.toString(),
    buyerDelta: (buyerAfter - buyerBefore).toString(),
    recipientDelta: (recipientAfter - recipientBefore).toString(),
  };

  console.log(`Status ${capture.finalStatus}. Buyer delta ${formatUnits(buyerAfter - buyerBefore, 6)} USDC.`);

  mkdirSync(rawDir, { recursive: true });
  writeFileSync(resolve(rawDir, "raw.json"), JSON.stringify(serialize(capture), null, 2));
  console.log(`Wrote raw capture -> apps/demo/.capture/raw.json`);

  if (SETTLE) {
    const fixture = sanitize(capture);
    mkdirSync(webFixtures, { recursive: true });
    writeFileSync(resolve(webFixtures, "replay.json"), JSON.stringify(fixture, null, 2));
    console.log(`Wrote sanitized fixture -> apps/web/src/fixtures/replay.json`);
  } else {
    console.log("Dry run: skipped sanitized fixture (no settlement).");
  }
}

// BigInt-safe JSON.
function serialize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}

const PLACEHOLDER = {
  recipient: "0x1111111111111111111111111111111111111111",
  buyer: "0x2222222222222222222222222222222222222222",
  tx: "0x" + "ab".repeat(32),
  nonce: "0x" + "cd".repeat(32),
};

function sanitize(cap: Capture) {
  const data = serialize(cap) as Record<string, unknown>;

  // Build a deep string-replacement map of every real identifier -> placeholder.
  const replacements = new Map<string, string>();
  const addAddr = (real: string, ph: string) => {
    replacements.set(real, ph);
    replacements.set(real.toLowerCase(), ph);
    try {
      replacements.set(getAddress(real as `0x${string}`), ph);
    } catch {}
  };
  addAddr(buyer.address, PLACEHOLDER.buyer);
  addAddr(recipient, PLACEHOLDER.recipient);

  const settlement = (data.settlement as { transaction?: string } | undefined) ?? undefined;
  const txHash = settlement?.transaction ?? (data.settle as { response?: { transaction?: string } } | undefined)?.response?.transaction;
  if (txHash) {
    replacements.set(txHash, PLACEHOLDER.tx);
    replacements.set(txHash.toLowerCase(), PLACEHOLDER.tx);
  }

  // EIP-3009 nonce lives in the payment payload authorization.
  const auth = (data.paymentPayload as { payload?: { authorization?: { nonce?: string } } } | undefined)?.payload?.authorization;
  if (auth?.nonce) {
    replacements.set(auth.nonce, PLACEHOLDER.nonce);
    replacements.set(auth.nonce.toLowerCase(), PLACEHOLDER.nonce);
  }

  let json = JSON.stringify(data);
  for (const [from, to] of replacements) {
    json = json.split(from).join(to);
  }
  // The raw EIP-712 signature is a real secret-ish artifact; null it out (the lesson
  // shows that a signature exists and its length, not the bytes).
  const sanitized = JSON.parse(json) as Record<string, unknown>;
  scrubSignatures(sanitized);

  // Re-encode the payment-required header from the sanitized object so it stays consistent.
  if (sanitized.paymentRequired) {
    sanitized.paymentRequiredHeader = encodePaymentRequiredHeader(sanitized.paymentRequired as never);
  }
  // Sanitized arbiscan link.
  if (typeof (sanitized.finalBody as { _payment?: { arbiscan?: string } })?._payment?.arbiscan === "string") {
    (sanitized.finalBody as { _payment: { arbiscan: string } })._payment.arbiscan =
      `${ARBITRUM_ONE.arbiscanTxBase}${PLACEHOLDER.tx}`;
  }
  return sanitized;
}

function scrubSignatures(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(scrubSignatures);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "signature" && typeof v === "string" && v.startsWith("0x")) {
        (node as Record<string, unknown>)[k] = "0x" + "ef".repeat(65);
      } else {
        scrubSignatures(v);
      }
    }
  }
}

main()
  .catch((err) => {
    console.error("Capture failed:", err);
    process.exitCode = 1;
  })
  .finally(() => server.close());
