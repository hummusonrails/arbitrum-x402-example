import { createPrivateKey, KeyObject, randomBytes, sign } from "node:crypto";

export interface MintJwtArgs {
  apiKeyId: string;
  privateKeyPem: string;
  method: string;
  url: string;
}

function base64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

// ed25519 pkcs8 der prefix for wrapping a raw 32-byte seed
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

// cdp keys are either ed25519 (raw base64 seed) or ec (pem)
function loadPrivateKey(input: string): { key: KeyObject; alg: "ES256" | "EdDSA" } {
  let key: KeyObject;

  if (input.includes("-----BEGIN")) {
    // env-stored pems often carry escaped newlines
    key = createPrivateKey(input.replace(/\\n/g, "\n"));
  } else {
    const raw = Buffer.from(input.trim(), "base64");
    let seed: Buffer;
    if (raw.length === 32) {
      seed = raw;
    } else if (raw.length === 64) {
      seed = raw.subarray(0, 32);
    } else {
      throw new Error(
        `Could not parse CDP private key. Not PEM and raw base64 is ${raw.length} bytes, expected 32 or 64 for Ed25519.`
      );
    }
    key = createPrivateKey({
      key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
      format: "der",
      type: "pkcs8",
    });
  }

  if (key.asymmetricKeyType === "ed25519") return { key, alg: "EdDSA" };
  if (key.asymmetricKeyType === "ec") return { key, alg: "ES256" };
  throw new Error(`Unsupported CDP private key type: ${key.asymmetricKeyType}`);
}

// cdp wants a per-request jwt bound to method+url with a 2-minute expiry
export function mintCdpJwt(args: MintJwtArgs): string {
  const parsed = new URL(args.url);
  const uri = `${args.method.toUpperCase()} ${parsed.host}${parsed.pathname}`;
  const { key, alg } = loadPrivateKey(args.privateKeyPem);

  const header = {
    alg,
    typ: "JWT",
    kid: args.apiKeyId,
    nonce: randomBytes(16).toString("hex"),
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: args.apiKeyId,
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: now,
    exp: now + 120,
    uri,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  const signature =
    alg === "EdDSA"
      ? sign(null, Buffer.from(signingInput), key)
      : sign("SHA256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });

  return `${signingInput}.${base64url(signature)}`;
}
