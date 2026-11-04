import { supabase } from "@/integrations/supabase/client";

export type Range = "24h" | "7d" | "30d" | "90d" | "1y";
export interface SearchHit { universeId: number; name: string; creator: string; playing: number; icon: string | null }
export interface Point { captured_at: string; playing: number; visits: number; favorites: number; up_votes: number; down_votes: number }
export interface LiveGame {
  universe_id: number; root_place_id: number; name: string; creator_name: string | null; icon_url: string | null; thumb_url: string | null;
  creator_id?: number | null; creator_type?: "User" | "Group" | null; creator_verified?: boolean;
  genre: string | null; created_at_rbx: string; updated_at_rbx: string; max_players: number; description: string;
  playing: number; visits: number; favorites: number; up_votes: number; down_votes: number;
}
export interface GameReport { game: LiveGame; history: Point[]; trackedSince: string | null; rank?: { rank: number; of: number } | null }
export interface PulseGame { id: number; name: string; creator: string | null; icon: string | null; genre: string | null; created: string | null; playing: number; prior: number | null; change: number | null }
export interface Pulse { tracked: number; totalNow: number; series: { t: string; v: number }[]; top: PulseGame[]; rising: PulseGame[]; newest: PulseGame[]; at: string }

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("rbx", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export const searchGames = (q: string) => call<{ results: SearchHit[] }>({ action: "search", q }).then((r) => r.results);
export const fetchReport = (id: number, range: Range) => call<GameReport>({ action: "game", id, range });
/** Latest readings across every game Outrun tracks (not all of Roblox). */
export const fetchPulse = () => call<Pulse>({ action: "pulse" });

/* ---------- derived metrics (pure) ---------- */
// Public assumptions for estimates — no platform exposes real revenue publicly.
export const ROBUX_PER_PLAYER_HOUR = 1.2;
export const DEVEX_USD_PER_ROBUX = 0.0038;

const HOUR = 36e5;
/** Time-weighted player-hours over the samples (trapezoid). */
export function playerHours(h: Point[]): number {
  let t = 0;
  for (let i = 1; i < h.length; i++) {
    const dt = (Date.parse(h[i].captured_at) - Date.parse(h[i - 1].captured_at)) / HOUR;
    if (dt > 0 && dt < 6) t += ((h[i].playing + h[i - 1].playing) / 2) * dt; // skip big gaps
  }
  return t;
}
export function avgCcu(h: Point[]): number {
  if (!h.length) return 0;
  const span = h.length > 1 ? (Date.parse(h.at(-1)!.captured_at) - Date.parse(h[0].captured_at)) / HOUR : 0;
  const ph = playerHours(h);
  return span > 0 && ph > 0 ? ph / span : h.reduce((s, p) => s + p.playing, 0) / h.length;
}
export const peakCcu = (h: Point[]) => h.reduce((m, p) => Math.max(m, p.playing), 0);
/** % change of average CCU, second half vs first half. null if not enough data. */
export function momentum(h: Point[]): number | null {
  if (h.length < 4) return null;
  const mid = Math.floor(h.length / 2);
  const a = avgCcu(h.slice(0, mid)), b = avgCcu(h.slice(mid));
  return a > 0 ? ((b - a) / a) * 100 : null;
}
/** Visits gained per day across the window. */
export function visitsPerDay(h: Point[]): number | null {
  if (h.length < 2) return null;
  const days = (Date.parse(h.at(-1)!.captured_at) - Date.parse(h[0].captured_at)) / (24 * HOUR);
  return days > 0.04 ? (h.at(-1)!.visits - h[0].visits) / days : null;
}
export function monthlyRevenue(avg: number) {
  const robux = avg * 24 * 30 * ROBUX_PER_PLAYER_HOUR;
  return { robux, usd: robux * DEVEX_USD_PER_ROBUX, low: robux * 0.5 * DEVEX_USD_PER_ROBUX, high: robux * 2 * DEVEX_USD_PER_ROBUX };
}
export const likeRatio = (up: number, down: number) => (up + down > 0 ? (up / (up + down)) * 100 : null);
export const compact = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Roblox reports "All" when a game has no real genre. */
export const realGenre = (g: string | null | undefined) => (g && g !== "All" ? g : null);
export const pctChange = (from: number | null | undefined, to: number | null | undefined) =>
  from == null || to == null || !(from > 0) ? null : ((to - from) / from) * 100;

/** Change in live players vs the reading closest to `ms` ago (falls back to the oldest reading). */
export function changeSince(h: Point[], ms: number, now = Date.now()): number | null {
  if (h.length < 2) return null;
  const target = now - ms;
  let base = h[0];
  for (const p of h) { if (Date.parse(p.captured_at) <= target) base = p; else break; }
  return pctChange(base.playing, h.at(-1)!.playing);
}

/** Round up to a readable axis ceiling: 1, 2, 2.5, 5 × 10ⁿ. */
export function niceCeil(n: number): number {
  if (!(n > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(n));
  return ([1, 2, 2.5, 5, 10].find((m) => m * e >= n) ?? 10) * e;
}

export type Unit = "hour" | "day" | "week";
export const unitFor = (r: Range): Unit => (r === "24h" ? "hour" : r === "7d" || r === "30d" ? "day" : "week");
const UNIT_MS: Record<Unit, number> = { hour: HOUR, day: 24 * HOUR, week: 7 * 24 * HOUR };
function unitStart(t: number, u: Unit) {
  const d = new Date(t);
  if (u === "hour") d.setMinutes(0, 0, 0);
  else { d.setHours(0, 0, 0, 0); if (u === "week") d.setDate(d.getDate() - d.getDay()); }
  return d.getTime();
}
export interface Period { start: string; peak: number; avg: number; hours: number; visits: number | null; samples: number; partial: boolean }
/**
 * Groups readings into hour/day/week periods. `partial` marks periods that are still running
 * or where readings cover less than half the period, so charts never present them as complete.
 */
export function periods(h: Point[], unit: Unit, now = Date.now()): Period[] {
  const groups = new Map<number, Point[]>();
  for (const p of h) {
    const k = unitStart(Date.parse(p.captured_at), unit);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(p);
  }
  const out: Period[] = [];
  let prevLast: Point | null = null;
  for (const [k, pts] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const first = pts[0], last = pts.at(-1)!;
    const base = prevLast ?? (pts.length > 1 ? first : null);
    const span = Date.parse(last.captured_at) - Date.parse((prevLast ?? first).captured_at);
    out.push({
      start: new Date(k).toISOString(), peak: peakCcu(pts), avg: avgCcu(pts), hours: playerHours(prevLast ? [prevLast, ...pts] : pts),
      visits: base ? Math.max(0, last.visits - base.visits) : null, samples: pts.length,
      partial: k + UNIT_MS[unit] > now || span < UNIT_MS[unit] / 2,
    });
    prevLast = last;
  }
  return out;
}
/** Latest period that is complete, falling back to the latest one. */
export const latestComplete = (ps: Period[]) => [...ps].reverse().find((p) => !p.partial) ?? ps.at(-1) ?? null;
export const robuxFor = (hours: number) => hours * ROBUX_PER_PLAYER_HOUR;
