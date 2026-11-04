import { describe, expect, it } from "vitest";
import { avgCcu, changeSince, latestComplete, likeRatio, momentum, monthlyRevenue, niceCeil, pctChange, peakCcu, periods, playerHours, realGenre, unitFor, visitsPerDay, type Point } from "./rbx";

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

const at = (iso: string, playing: number, visits = 0): Point => ({ captured_at: iso, playing, visits, favorites: 0, up_votes: 0, down_votes: 0 });

describe("overview periods", () => {
  const day1 = Array.from({ length: 24 }, (_, i) => at(new Date(2026, 0, 1, i).toISOString(), 100 + i, 1000 + i * 10));
  const day2 = Array.from({ length: 6 }, (_, i) => at(new Date(2026, 0, 2, i).toISOString(), 300, 1300 + i * 10));
  const now = new Date(2026, 0, 2, 6).getTime();
  const ps = periods([...day1, ...day2], "day", now);

  it("groups readings into one period per day", () => expect(ps).toHaveLength(2));
  it("takes the peak inside each day", () => { expect(ps[0].peak).toBe(123); expect(ps[1].peak).toBe(300); });
  it("counts visits gained from the previous day's last reading", () => expect(ps[1].visits).toBe(1350 - 1230));
  it("marks the running day as partial and the full day as complete", () => { expect(ps[1].partial).toBe(true); expect(ps[0].partial).toBe(false); });
  it("latestComplete skips the running day", () => expect(latestComplete(ps)?.start).toBe(ps[0].start));
  it("a single first reading has no visits gain", () => expect(periods([at(new Date(2026, 0, 1).toISOString(), 5, 9)], "day", now)[0].visits).toBeNull());
  it("handles no readings", () => { expect(periods([], "day")).toEqual([]); expect(latestComplete([])).toBeNull(); });
  it("picks bucket size per range", () => { expect(unitFor("24h")).toBe("hour"); expect(unitFor("30d")).toBe("day"); expect(unitFor("1y")).toBe("week"); });
});

describe("overview helpers", () => {
  it("pctChange", () => { expect(pctChange(100, 125)).toBe(25); expect(pctChange(0, 5)).toBeNull(); expect(pctChange(null, 5)).toBeNull(); });
  it("changeSince compares with the reading ~24h earlier", () => {
    const h = [at(new Date(2026, 0, 1, 0).toISOString(), 100), at(new Date(2026, 0, 1, 12).toISOString(), 400), at(new Date(2026, 0, 2, 0).toISOString(), 200)];
    expect(changeSince(h, 864e5, new Date(2026, 0, 2, 0).getTime())).toBe(100);
    expect(changeSince(h.slice(0, 1), 864e5)).toBeNull();
  });
  it("niceCeil rounds to readable axis maxima", () => { expect(niceCeil(7300)).toBe(10000); expect(niceCeil(1800)).toBe(2000); expect(niceCeil(2100)).toBe(2500); expect(niceCeil(0)).toBe(1); });
  it("treats Roblox's 'All' genre as none", () => { expect(realGenre("All")).toBeNull(); expect(realGenre("RPG")).toBe("RPG"); });
});
