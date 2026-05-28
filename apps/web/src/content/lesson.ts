import type { SnippetId } from "@/generated/snippets";
import type { WireChannel } from "@/lib/wire";

export type VizKind = "accepts" | "eip3009" | "jwt" | "balances" | "units";

export interface LessonStep {
  n: number;
  key: string;
  title: string;
  tagline: string;
  concept: string[];
  snippetId: SnippetId;
  highlight: string[];
  viz: VizKind[];
  activeChannels: WireChannel[];
  modal: { title: string; body: string[] };
}

export const STEPS: LessonStep[] = [
  {
    n: 1,
    key: "offer",
    title: "The 402 offer",
    tagline: "HTTP says: pay first.",
    concept: [
      "The buyer asks for a protected resource with no payment attached. Instead of an API key prompt or a login wall, the server answers 402 Payment Required and hands back a machine-readable offer.",
      "That offer, the accepts[] array, fully describes the deal: the scheme (exact), the asset (USDC), the network (Arbitrum One), the price in base units, and the address to pay. No account, no prior relationship. Any client can read it and decide to pay.",
    ],
    snippetId: "requirements",
    highlight: ['scheme: "exact"', "amount: config.priceUsdc", "payTo: config.recipientAddress", "extra: ARBITRUM_ONE.usdcEip712"],
    viz: ["accepts", "units"],
    activeChannels: ["buyer", "merchant"],
    modal: {
      title: "Why 402?",
      body: [
        "Status code 402 has been reserved in the HTTP spec since the 1990s and left almost entirely unused, a placeholder for a payments layer the web never standardized.",
        "x402 revives it. The merchant returns the payment terms in a header and JSON body so that any HTTP client, including an autonomous agent, can understand the price without human intervention or a proprietary SDK.",
        "Unlike an API key (a shared secret you provision ahead of time) the 402 offer is stateless and self-describing: it travels with the response and is valid for exactly one resource at one price.",
      ],
    },
  },
  {
    n: 2,
    key: "sign",
    title: "Signing the authorization",
    tagline: "A signature, not a transaction.",
    concept: [
      "To pay, the buyer does not send a transaction. It signs an EIP-3009 transferWithAuthorization message over the USDC EIP-712 domain. That signature, produced off-chain, authorizes one specific transfer.",
      "The signed message pins down from, to, value, a validity window, and a random nonce. No gas leaves the buyer's wallet, and nothing touches the chain yet. The signature alone is the payment instrument.",
    ],
    snippetId: "buyer",
    highlight: ["signTypedData", "new ExactEvmScheme(signer)", "wrapFetchWithPayment"],
    viz: ["eip3009"],
    activeChannels: ["buyer"],
    modal: {
      title: "EIP-3009, gaslessly",
      body: [
        "EIP-3009 adds transferWithAuthorization to USDC: anyone holding a valid signature can submit the transfer and pay the gas, while the funds move from the signer. This is what lets a buyer pay without holding ETH.",
        "Replay safety comes from two fields. The nonce is a one-time random 32-byte value the token marks as used. validAfter / validBefore bound the signature to a short time window, so a leaked signature cannot be redeemed later.",
        "EIP-712 domain separation ties the signature to exactly this token: name 'USD Coin', version '2', chainId 42161, and the USDC contract as verifyingContract. The same signature is meaningless against any other token or chain.",
      ],
    },
  },
  {
    n: 3,
    key: "verify",
    title: "Verify with the facilitator",
    tagline: "Prove it before you trust it.",
    concept: [
      "The buyer replays the request, now carrying the signed payload in the PAYMENT-SIGNATURE header. The merchant does not trust it blindly. It forwards the payload to the Coinbase CDP facilitator's /verify endpoint.",
      "Each call is authenticated with a short-lived JWT the merchant mints on the spot: bound to the exact method and URL, valid for two minutes, signed with the merchant's CDP key. The facilitator checks the signature and the buyer's balance and returns isValid.",
    ],
    snippetId: "cdpJwt",
    highlight: ["exp: now + 120", "uri,", "kid: args.apiKeyId", "alg,"],
    viz: ["jwt"],
    activeChannels: ["merchant", "facilitator"],
    modal: {
      title: "How CDP JWT auth works",
      body: [
        "Rather than a static bearer token, every facilitator request gets its own JWT. The claim set binds the token to one HTTP method and URI and expires after 120 seconds, so a captured token cannot be replayed against a different endpoint or reused later.",
        "The merchant's CDP key can be Ed25519 (signed as EdDSA) or an EC P-256 key (signed as ES256). The minter detects which and signs accordingly, adding a random nonce to each header.",
        "Verification is read-only: it confirms the signature recovers to the payer and that the balance covers the amount. No funds move in this step; it is the merchant's safety check before asking for settlement.",
      ],
    },
  },
  {
    n: 4,
    key: "settle",
    title: "Settle on Arbitrum One",
    tagline: "The facilitator moves the money.",
    concept: [
      "Satisfied, the merchant calls /settle. The facilitator takes the buyer's signed authorization and submits transferWithAuthorization on Arbitrum One, paying the gas itself.",
      "The buyer's off-chain signature is redeemed on-chain in a single transfer: USDC leaves the buyer and lands with the payee. The facilitator returns the transaction hash as proof.",
    ],
    snippetId: "facilitator",
    highlight: ["callFacilitator", 'path: "verify" | "settle"', "mintCdpJwt", "Bearer ${jwt}"],
    viz: ["balances"],
    activeChannels: ["merchant", "facilitator", "chain"],
    modal: {
      title: "Settlement and gas",
      body: [
        "The facilitator acts as the relayer. Because it submits the transaction, it pays the Arbitrum gas, so the buyer needs only USDC, never ETH. This is the practical payoff of the EIP-3009 design.",
        "Arbitrum One settles the transfer with Ethereum-grade security at a fraction of the cost, so a $0.01 payment is economically sensible. The transfer is a normal ERC-20 movement, visible on Arbiscan like any other.",
        "Settlement is the only step that changes on-chain state. Everything before it (the offer, the signature, the verify) is preparation; this is the moment value actually moves.",
      ],
    },
  },
  {
    n: 5,
    key: "unlocked",
    title: "Content unlocked",
    tagline: "200 OK, proof attached.",
    concept: [
      "With settlement confirmed, the merchant finally serves the gated resource: 200 OK with the premium JSON. It also attaches an X-PAYMENT-RESPONSE header carrying the settlement proof: the transaction hash the buyer can check on Arbiscan.",
      "The whole exchange was one logical HTTP request that paid for itself. No invoices, no accounts, no out-of-band billing, just a 402, a signature, and a settled transfer, composable enough for an agent to do thousands of times.",
    ],
    snippetId: "merchant",
    highlight: ["verifyPayment", "settlePayment", "encodePaymentResponseHeader", "premiumContent()"],
    viz: ["balances", "units"],
    activeChannels: ["buyer", "merchant", "chain"],
    modal: {
      title: "The whole loop",
      body: [
        "Step back and the shape is simple: request → 402 offer → sign → verify → settle → 200. Two HTTP round trips carried a real, final USDC payment.",
        "Because the protocol is just HTTP plus a signature, it composes. An API can price each route, an MCP server can charge per call, and an autonomous agent can pay as it goes, all without bespoke billing infrastructure.",
        "That is the point of x402 on Arbitrum: payments become a first-class, machine-native part of the request, settled cheaply and verifiably on-chain.",
      ],
    },
  },
];

// Representative CDP JWT structure (no real key material) for the verify-step visual.
export const JWT_SAMPLE = {
  header: { alg: "EdDSA", typ: "JWT", kid: "<your-cdp-api-key-id>", nonce: "a1b2c3…(random per request)" },
  payload: {
    sub: "<your-cdp-api-key-id>",
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: "<now>",
    exp: "<now + 120s>",
    uri: "POST api.cdp.coinbase.com/platform/v2/x402/verify",
  },
} as const;
