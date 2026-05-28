import { describe, it, expect } from "vitest";
import { generateKeyPairSync, verify } from "node:crypto";
import { mintCdpJwt } from "../src/cdp-jwt";

function decodeSegment(seg: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));
}

const apiKeyId = "11111111-2222-3333-4444-555555555555";
const url = "https://api.cdp.coinbase.com/platform/v2/x402/verify";

describe("mintCdpJwt", () => {
  it("mints an EdDSA JWT from an Ed25519 raw base64 seed and the signature verifies", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    // pkcs8 DER = 16-byte prefix + 32-byte seed; the minter rebuilds that wrapper from the seed.
    const der = privateKey.export({ format: "der", type: "pkcs8" });
    const seed = der.subarray(der.length - 32);
    const seedB64 = seed.toString("base64");

    const jwt = mintCdpJwt({ apiKeyId, privateKeyPem: seedB64, method: "POST", url });
    const [h, p, s] = jwt.split(".");
    expect(h && p && s).toBeTruthy();

    const header = decodeSegment(h!);
    const payload = decodeSegment(p!);
    expect(header.alg).toBe("EdDSA");
    expect(header.typ).toBe("JWT");
    expect(header.kid).toBe(apiKeyId);
    expect(typeof header.nonce).toBe("string");
    expect(payload.sub).toBe(apiKeyId);
    expect(payload.iss).toBe("cdp");
    expect(payload.aud).toEqual(["cdp_service"]);
    expect(payload.uri).toBe("POST api.cdp.coinbase.com/platform/v2/x402/verify");
    expect((payload.exp as number) - (payload.nbf as number)).toBe(120);

    const ok = verify(null, Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s!, "base64url"));
    expect(ok).toBe(true);
  });

  it("mints an ES256 JWT from an EC PEM and the signature verifies", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const pem = privateKey.export({ format: "pem", type: "pkcs8" }) as string;

    const jwt = mintCdpJwt({ apiKeyId, privateKeyPem: pem, method: "POST", url });
    const [h, p, s] = jwt.split(".");
    const header = decodeSegment(h!);
    expect(header.alg).toBe("ES256");

    const ok = verify(
      "SHA256",
      Buffer.from(`${h}.${p}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(s!, "base64url")
    );
    expect(ok).toBe(true);
  });

  it("accepts PEMs that carry escaped newlines (as env vars often store them)", () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const pem = (privateKey.export({ format: "pem", type: "pkcs8" }) as string).replace(/\n/g, "\\n");
    expect(() => mintCdpJwt({ apiKeyId, privateKeyPem: pem, method: "POST", url })).not.toThrow();
  });

  it("rejects a base64 blob that is neither 32 nor 64 bytes", () => {
    const bad = Buffer.alloc(20).toString("base64");
    expect(() => mintCdpJwt({ apiKeyId, privateKeyPem: bad, method: "POST", url })).toThrow(/Ed25519/);
  });
});
