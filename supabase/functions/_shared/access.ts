// Pure access rules shared by edge functions (no runtime imports, so they're unit-testable).

export const PUBLIC_ORIGIN = "https://outrunservice.lovable.app";
const ALLOWED_ORIGINS = new Set([
  PUBLIC_ORIGIN,
  "https://id-preview--c739b7ca-5dc0-48ab-b53e-9bcee9450c98.lovable.app",
  "https://c739b7ca-5dc0-48ab-b53e-9bcee9450c98.lovableproject.com",
  "http://localhost:8080",
]);

/** Billing return links only ever point at our own sites; anything else falls back to the public site. */
export function returnOrigin(origin: string | null | undefined): string {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : PUBLIC_ORIGIN;
}

export type PlanTier = "free" | "starter" | "premium" | "enterprise";
export interface SubRow {
  tier: PlanTier;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
}

/** Plan in force right now: lapsed or inactive paid plans count as free. Staff-assigned enterprise (no Stripe sub) never lapses. */
export function effectiveTier(sub: SubRow | null | undefined, now = Date.now()): PlanTier {
  if (!sub || sub.tier === "free") return "free";
  if (sub.status !== "active" && sub.status !== "trialing") return "free";
  if (sub.tier === "enterprise" && !sub.stripe_subscription_id) return "enterprise";
  const end = sub.current_period_end ? Date.parse(sub.current_period_end) : NaN;
  return Number.isFinite(end) && end > now ? sub.tier : "free";
}

const RANK: Record<PlanTier, number> = { free: 0, starter: 1, premium: 2, enterprise: 3 };
export const meetsTier = (sub: SubRow | null | undefined, min: PlanTier, now = Date.now()) =>
  RANK[effectiveTier(sub, now)] >= RANK[min];
