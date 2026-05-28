import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { ExactEvmScheme } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ARBITRUM_ONE } from "./networks.js";

const RESOURCE_URL = process.env.RESOURCE_URL ?? "http://localhost:4021/report";
const privateKey = process.env.BUYER_PRIVATE_KEY;

if (!privateKey) {
  console.error("Set BUYER_PRIVATE_KEY in .env (a funded Arbitrum One wallet holding USDC).");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey as `0x${string}`);

// exact-evm scheme only needs address + signtypeddata
const signer = {
  address: account.address,
  signTypedData: (message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => account.signTypedData(message as Parameters<typeof account.signTypedData>[0]),
};

const client = new x402Client().register(ARBITRUM_ONE.network, new ExactEvmScheme(signer));
const paidFetch = wrapFetchWithPayment(fetch, client);

async function main() {
  console.log(`GET ${RESOURCE_URL}`);
  console.log(`  paying from ${account.address} on ${ARBITRUM_ONE.network}\n`);

  const response = await paidFetch(RESOURCE_URL);
  const body = await response.json();

  console.log(`Status: ${response.status}`);
  console.log("Body:");
  console.log(JSON.stringify(body, null, 2));

  // settlement proof comes back in the x-payment-response header
  const settleHeader = response.headers.get("x-payment-response");
  if (settleHeader) {
    const settle = decodePaymentResponseHeader(settleHeader);
    if (settle.transaction) {
      console.log(`\nSettled on-chain: ${ARBITRUM_ONE.arbiscanTxBase}${settle.transaction}`);
    }
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
