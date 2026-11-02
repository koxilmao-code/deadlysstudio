import { describe, expect, it } from "vitest";
import { effectiveTier, meetsTier, returnOrigin, PUBLIC_ORIGIN, type SubRow } from "../../supabase/functions/_shared/access";

const NOW = Date.parse("2026-11-02T00:00:00Z");
const sub = (p: Partial<SubRow>): SubRow => ({ tier: "starter", status: "active", current_period_end: "2026-12-01T00:00:00Z", stripe_subscription_id: "sub_1", ...p });

describe("billing return origin", () => {
  it("keeps the published site", () => expect(returnOrigin(PUBLIC_ORIGIN)).toBe(PUBLIC_ORIGIN));
  it("replaces an outside site with the published site", () => expect(returnOrigin("https://evil.example")).toBe(PUBLIC_ORIGIN));
  it("rejects look-alike subdomains", () => expect(returnOrigin("https://outrunservice.lovable.app.evil.example")).toBe(PUBLIC_ORIGIN));
  it("falls back when missing", () => expect(returnOrigin(null)).toBe(PUBLIC_ORIGIN));
});

describe("90d/1y access (Starter and above, active plans only)", () => {
  it("allows an active Starter plan", () => expect(meetsTier(sub({}), "starter", NOW)).toBe(true));
  it("blocks a Starter plan whose period has ended", () => expect(meetsTier(sub({ current_period_end: "2026-11-01T00:00:00Z" }), "starter", NOW)).toBe(false));
  it("blocks a canceled Premium plan", () => expect(meetsTier(sub({ tier: "premium", status: "canceled" }), "starter", NOW)).toBe(false));
  it("blocks Free", () => expect(meetsTier(sub({ tier: "free" }), "starter", NOW)).toBe(false));
  it("blocks no plan record", () => expect(meetsTier(null, "starter", NOW)).toBe(false));
  it("keeps staff-assigned enterprise without a Stripe sub", () => expect(effectiveTier(sub({ tier: "enterprise", stripe_subscription_id: null, current_period_end: "2020-01-01T00:00:00Z" }), NOW)).toBe("enterprise"));
  it("lapses a Stripe-paid Scale plan after its period", () => expect(effectiveTier(sub({ tier: "enterprise", current_period_end: "2026-10-01T00:00:00Z" }), NOW)).toBe("free"));
});
