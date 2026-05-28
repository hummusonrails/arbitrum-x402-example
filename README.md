<!-- Banner -->
<p align="center">
  <img src=".github/banner.svg" alt="x402-arbitrum-cdp-facilitator" width="100%">
</p>

<!-- Badges -->
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-20.x-339933.svg?style=flat-square" alt="Node 20"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat-square" alt="TypeScript"></a>
  <a href="https://viem.sh/"><img src="https://img.shields.io/badge/viem-2.x-1B1B1F.svg?style=flat-square" alt="viem 2"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000.svg?style=flat-square" alt="Next.js 16"></a>
  <a href="https://www.x402.org/"><img src="https://img.shields.io/badge/x402-v2-8B5CF6.svg?style=flat-square" alt="x402 v2"></a>
  <a href="https://arbitrum.io/"><img src="https://img.shields.io/badge/Arbitrum-One-12AAFF.svg?style=flat-square" alt="Arbitrum One"></a>
  <a href="#contributing"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"></a>
</p>

<!-- One-liner + nav -->
<p align="center">
  <strong>An x402 v2 example on Arbitrum One: an HTTP merchant returns <code>402</code>, a viem wallet pays, and the Coinbase CDP facilitator settles USDC. Ships with a CLI demo and an interactive teaching frontend.</strong>
  <br>
  <a href="https://www.x402.org/">x402 Protocol</a> · <a href="#quick-start">Quick Start</a> · <a href="#interactive-walkthrough">Interactive Walkthrough</a>
</p>

## What it does

- **Returns** an x402 v2 `402 Payment Required`, advertising price, asset, and payee.
- **Signs** an EIP-3009 `transferWithAuthorization` on the buyer with a viem wallet.
- **Verifies and settles** each payment through the Coinbase CDP facilitator, which submits the transfer on Arbitrum One.
- **Serves** the gated JSON only after settlement, returning the on-chain transaction hash to the buyer.
- **Teaches** the whole flow in a browser walkthrough that reuses the exact protocol code, with a step-by-step lesson and a live wire-traffic console.

## Quick Start

This is a pnpm monorepo. Install once at the root, then run the CLI demo or the frontend.

```bash
pnpm install
cp .env.example .env
# Edit .env. Server: RECIPIENT_ADDRESS, CDP_API_KEY_ID, CDP_PRIVATE_KEY
#            Buyer:  BUYER_PRIVATE_KEY (a funded Arbitrum One wallet holding USDC)
```

CLI demo:

```bash
pnpm serve   # terminal 1: starts the merchant on http://localhost:4021/report
pnpm buy     # terminal 2: pays and prints the gated content + Arbiscan link
```

Interactive frontend:

```bash
pnpm web     # starts the teaching walkthrough on http://localhost:3000
```

## Interactive walkthrough

The `apps/web` Next.js app walks through the payment in five steps (402, sign, verify, settle, unlocked) in a split view: a lesson on the left, a live console streaming the real request and response wire traffic on the right.

- **Replay mode** (default) animates a real settlement captured from an instrumented run. No wallet or funds are needed; identifiers (addresses, tx hash, nonce, signature) are scrubbed to placeholders, while the amounts and structure are real.
- **Live mode** lets a connected wallet sign the real EIP-3009 authorization in the browser and settles a real ~$0.01 USDC payment through the merchant API route. Requires `CDP_API_KEY_ID` and `CDP_PRIVATE_KEY` in `.env`.

The code snippets shown in the lesson are extracted from the actual source at build time, so the lesson always matches the code that runs.

## Architecture

```mermaid
graph LR
    subgraph Buyer[Buyer]
      B[buyer.ts<br/>viem wallet]
    end
    subgraph Merchant[Merchant]
      S[server.ts<br/>Express 402 handler]
    end
    CDP[CDP Facilitator]
    L1[Arbitrum One USDC]

    B -->|GET /report| S
    S -->|402 + accepts| B
    B -->|GET /report + PAYMENT-SIGNATURE| S
    S -->|verify + settle| CDP
    CDP -->|transferWithAuthorization| L1
    L1 -->|tx hash| CDP
    CDP -->|success| S
    S -->|200 + gated JSON + tx| B

    classDef arb fill:#12AAFF,stroke:#fff,color:#0b1018
    classDef cdp fill:#1652F0,stroke:#fff,color:#fff
    class L1 arb
    class CDP cdp
```

## End-to-end flow

```mermaid
sequenceDiagram
    autonumber
    participant B as Buyer (viem)
    participant S as Merchant (Express)
    participant CDP as CDP Facilitator
    participant L1 as Arbitrum One

    B->>S: GET /report
    S-->>B: 402 + PAYMENT-REQUIRED header (accepts[])
    Note over B: Sign EIP-3009<br/>transferWithAuthorization
    B->>S: GET /report (PAYMENT-SIGNATURE)
    S->>CDP: POST /verify (JWT-authed)
    CDP-->>S: isValid
    S->>CDP: POST /settle (JWT-authed)
    CDP->>L1: transferWithAuthorization
    L1-->>CDP: tx hash
    CDP-->>S: success + transaction
    S-->>B: 200 + gated JSON + X-PAYMENT-RESPONSE
```

## Stack

| Layer | Tool |
|:------|:-----|
| Language | TypeScript, run with `tsx` on Node 20+ |
| Shared core | `@x402-arbitrum/core` (networks, 402 builder, CDP JWT, facilitator calls) |
| CLI merchant | Express |
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind v4 + wagmi v3 |
| Buyer wallet | viem local account (CLI) or connected wallet (frontend) |
| x402 client | `@x402/fetch` + `@x402/evm` (protocol v2) |
| Wire codec | `@x402/core/http` header encode/decode |
| Code highlighting | Shiki (server-side) |
| Settlement | Coinbase CDP facilitator (`/platform/v2/x402`) |
| Chain | Arbitrum One (CAIP-2 `eip155:42161`) |
| Asset | Native USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`) |

<details>
<summary><strong>Prerequisites</strong></summary>

- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/).
- A [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) API key (`id` + `privateKey`) for the merchant to authenticate to the facilitator.
- An EVM wallet funded with **USDC on Arbitrum One** for the buyer. Only the private key is needed. The facilitator submits the on-chain transfer, so the buyer wallet does not need ETH for gas.
- A `RECIPIENT_ADDRESS` to receive the USDC.

</details>

## Configuration

All configuration is via `.env` (see [`.env.example`](.env.example)):

| Variable | Side | Purpose |
|:---------|:-----|:--------|
| `RECIPIENT_ADDRESS` | server | EVM address that receives USDC |
| `PRICE_USDC` | server | Price per request in base units (6 decimals); `10000` = `$0.01` |
| `PORT` | server | Merchant listen port (default `4021`) |
| `CDP_API_KEY_ID` | server | CDP API key id |
| `CDP_PRIVATE_KEY` | server | CDP API key (Ed25519 raw base64 or EC PEM) |
| `BUYER_PRIVATE_KEY` | buyer | Private key of the funded Arbitrum One wallet |
| `RESOURCE_URL` | buyer | Merchant endpoint to pay (default `http://localhost:4021/report`) |

## Usage

Start the merchant, then run the buyer against it:

```bash
$ pnpm buy
GET http://localhost:4021/report
  paying from 0xYourBuyer... on eip155:42161

Status: 200
Body:
{
  "resource": "premium-market-data",
  "asOf": "2026-05-28T07:22:17.000Z",
  "payload": { "btc": 71234.56, "eth": 4567.89 },
  "_payment": {
    "txHash": "0x...",
    "network": "eip155:42161",
    "arbiscan": "https://arbiscan.io/tx/0x..."
  }
}

Settled on-chain: https://arbiscan.io/tx/0x...
```

You can also see the raw 402 with no wallet at all:

```bash
curl -i http://localhost:4021/report
```

## Project structure

A pnpm workspace. The shared `x402-core` package holds the protocol logic so the CLI demo and the frontend run the exact same code.

```
.
├── packages/
│   └── x402-core/        # shared protocol logic (no UI, no Express)
│       └── src/
│           ├── networks.ts      # Arbitrum One + CDP facilitator constants
│           ├── x402.ts          # builds the x402 v2 PaymentRequired
│           ├── cdp-jwt.ts       # short-lived CDP API JWT minting (Ed25519 / EC)
│           └── facilitator.ts   # explicit /verify + /settle calls
├── apps/
│   ├── demo/             # CLI demo
│   │   └── src/
│   │       ├── server.ts            # Express merchant: 402 -> verify -> settle
│   │       ├── buyer.ts             # viem wallet + x402 pay/retry client
│   │       └── capture-fixtures.ts  # records a real run into a sanitized fixture
│   └── web/              # Next.js teaching frontend
│       └── src/
│           ├── app/                 # routes incl. api/merchant/report (the live merchant)
│           ├── components/          # lesson, console, flow diagram, visualizations
│           ├── content/lesson.ts    # the five-step lesson content
│           └── fixtures/replay.json # sanitized captured wire data (replay mode)
├── .env.example          # single source of truth for both apps
├── pnpm-workspace.yaml
└── package.json          # root scripts: serve, buy, web, capture-fixtures
```

## Contributing

PRs welcome. Open an issue first for anything non-trivial.

## License

MIT. See [LICENSE](LICENSE).
