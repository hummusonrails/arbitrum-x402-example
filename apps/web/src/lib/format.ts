const USDC_DECIMALS = 6;

export function baseUnitsToUsdc(baseUnits: string | bigint): number {
  return Number(BigInt(baseUnits)) / 10 ** USDC_DECIMALS;
}

export function formatUsd(baseUnits: string | bigint): string {
  const value = baseUnitsToUsdc(baseUnits);
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatUsdc(baseUnits: string | bigint): string {
  const value = baseUnitsToUsdc(baseUnits);
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC`;
}

export function shortHex(hex: string, lead = 6, tail = 4): string {
  if (hex.length <= lead + tail + 2) return hex;
  return `${hex.slice(0, lead)}…${hex.slice(-tail)}`;
}

export function formatUnixTime(seconds: string | number): string {
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms)) return String(seconds);
  return new Date(ms).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
