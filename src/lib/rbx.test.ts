import { describe, expect, it } from "vitest";
import { avgCcu, likeRatio, momentum, monthlyRevenue, peakCcu, playerHours, visitsPerDay, type Point } from "./rbx";

const pt = (h: number, playing: number, visits = 0): Point => ({ captured_at: new Date(Date.UTC(2026, 0, 1, h)).toISOString(), playing, visits, favorites: 0, up_votes: 0, down_votes: 0 });

describe("rbx metrics", () => {
  it("computes player hours with trapezoids", () => expect(playerHours([pt(0, 100), pt(1, 300)])).toBe(200));
  it("skips gaps over 6h", () => expect(playerHours([pt(0, 100), pt(10, 100)])).toBe(0));
  it("handles empty input", () => { expect(avgCcu([])).toBe(0); expect(momentum([])).toBeNull(); expect(visitsPerDay([pt(0, 1)])).toBeNull(); });
  it("finds peak", () => expect(peakCcu([pt(0, 5), pt(1, 50), pt(2, 7)])).toBe(50));
  it("momentum rises", () => expect(momentum([pt(0, 100), pt(1, 100), pt(2, 200), pt(3, 200)])!).toBeGreaterThan(0));
  it("visits per day", () => expect(visitsPerDay([pt(0, 0, 0), pt(24, 0, 1000)])).toBe(1000));
  it("revenue range brackets estimate", () => { const r = monthlyRevenue(100); expect(r.low).toBeLessThan(r.usd); expect(r.high).toBeGreaterThan(r.usd); });
  it("like ratio", () => { expect(likeRatio(3, 1)).toBe(75); expect(likeRatio(0, 0)).toBeNull(); });
});
