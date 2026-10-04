import { supabase } from "@/integrations/supabase/client";

export type Range = "24h" | "7d" | "30d" | "90d" | "1y";
export interface SearchHit { universeId: number; name: string; creator: string; playing: number; icon: string | null }
export interface Point { captured_at: string; playing: number; visits: number; favorites: number; up_votes: number; down_votes: number }
export interface LiveGame {
  universe_id: number; root_place_id: number; name: string; creator_name: string | null; icon_url: string | null; thumb_url: string | null;
  genre: string | null; created_at_rbx: string; updated_at_rbx: string; max_players: number; description: string;
  playing: number; visits: number; favorites: number; up_votes: number; down_votes: number;
}
export interface GameReport { game: LiveGame; history: Point[]; trackedSince: string | null }

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("rbx", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export const searchGames = (q: string) => call<{ results: SearchHit[] }>({ action: "search", q }).then((r) => r.results);
export const fetchReport = (id: number, range: Range) => call<GameReport>({ action: "game", id, range });

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
