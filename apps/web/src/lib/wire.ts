// One event model the console renders identically for replay (captured fixtures)
// and live (real wallet) modes.
export type WireChannel = "buyer" | "merchant" | "facilitator" | "chain";
export type WireTone = "info" | "success" | "warn" | "error";

export interface WireEvent {
  id: string;
  /** Lesson step (1-5) this event belongs to. */
  step: number;
  channel: WireChannel;
  /** Short headline, e.g. "GET /report". */
  title: string;
  /** One human-readable line under the title. */
  detail?: string;
  /** Expandable JSON payload (typed data, verify/settle body, decoded header). */
  payload?: unknown;
  /** HTTP status, when the event is a response. */
  status?: number;
  tone?: WireTone;
  /** Optional external link, e.g. Arbiscan. */
  link?: { label: string; href: string };
}
