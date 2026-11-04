import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";
import { meetsTier } from "../_shared/access.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MIN_GAP_MS = 4 * 60 * 1000;
/** Ranges restricted to Starter and above; enforced against the caller's Stripe-backed tier. */
const GATED_RANGES = new Set(["90d", "1y"]);

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), q: z.string().trim().min(1).max(200) }),
  z.object({ action: z.literal("game"), id: z.coerce.number().int().positive(), range: z.enum(["24h", "7d", "30d", "90d", "1y"]).default("7d") }),
  z.object({ action: z.literal("poll") }),
  z.object({ action: z.literal("pulse") }),
]);
/** Live-only fields that are not columns on rbx_universes. */
const LIVE_ONLY = ["playing", "visits", "favorites", "up_votes", "down_votes", "description", "creator_id", "creator_type", "creator_verified"];
const universeRow = (g: Record<string, unknown>) => Object.fromEntries(Object.entries(g).filter(([k]) => !LIVE_ONLY.includes(k)));

async function get(url: string) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Roblox ${r.status}`);
  return r.json();
}

async function placeToUniverse(placeId: number): Promise<number | null> {
  try { return (await get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`)).universeId ?? null; } catch { return null; }
}

async function search(q: string) {
  const m = q.match(/roblox\.com\/games\/(\d+)/) ?? q.match(/^(\d{5,})$/);
  if (m) {
    const n = Number(m[1]);
    const u = (await placeToUniverse(n)) ?? n;
    const live = await fetchLive([u]).catch(() => []);
    if (live.length) return live.map((g) => ({ universeId: g.universe_id, name: g.name, creator: g.creator_name, playing: g.playing, icon: g.icon_url }));
  }
  const sid = crypto.randomUUID();
  const j = await get(`https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(q)}&sessionId=${sid}&pageType=all`);
  const games = (j.searchResults ?? []).filter((g: any) => g.contentGroupType === "Game").flatMap((g: any) => g.contents ?? []).slice(0, 12);
  const ids = games.map((g: any) => g.universeId);
  const icons = ids.length ? await get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids.join(",")}&size=150x150&format=Png`).catch(() => ({ data: [] })) : { data: [] };
  const iconMap = new Map((icons.data ?? []).map((i: any) => [i.targetId, i.imageUrl]));
  return games.map((g: any) => ({ universeId: g.universeId, name: g.name, creator: g.creatorName, playing: g.playerCount ?? 0, icon: iconMap.get(g.universeId) ?? null }));
}

async function fetchLive(ids: number[]) {
  const list = ids.join(",");
  const [games, votes, icons, thumbs] = await Promise.all([
    get(`https://games.roblox.com/v1/games?universeIds=${list}`),
    get(`https://games.roblox.com/v1/games/votes?universeIds=${list}`).catch(() => ({ data: [] })),
    get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${list}&size=512x512&format=Png`).catch(() => ({ data: [] })),
    get(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${list}&countPerUniverse=1&size=768x432&format=Png`).catch(() => ({ data: [] })),
  ]);
  const v = new Map((votes.data ?? []).map((x: any) => [x.id, x]));
  const ic = new Map((icons.data ?? []).map((x: any) => [x.targetId, x.imageUrl]));
  const th = new Map((thumbs.data ?? []).map((x: any) => [x.universeId, x.thumbnails?.[0]?.imageUrl]));
  return (games.data ?? []).map((g: any) => ({
    universe_id: g.id, root_place_id: g.rootPlaceId, name: g.name, creator_name: g.creator?.name ?? null,
    creator_id: g.creator?.id ?? null, creator_type: g.creator?.type ?? null, creator_verified: !!g.creator?.hasVerifiedBadge,
    icon_url: ic.get(g.id) ?? null, thumb_url: th.get(g.id) ?? null, genre: g.genre ?? null,
    created_at_rbx: g.created, updated_at_rbx: g.updated, max_players: g.maxPlayers, price: g.price ?? null,
    description: g.description ?? "",
    playing: g.playing ?? 0, visits: g.visits ?? 0, favorites: g.favoritedCount ?? 0,
    up_votes: (v.get(g.id) as any)?.upVotes ?? 0, down_votes: (v.get(g.id) as any)?.downVotes ?? 0,
  }));
}

async function record(live: any[]) {
  const c = db();
  const now = new Date().toISOString();
  await c.from("rbx_universes").upsert(live.map((g) => ({ ...universeRow(g), last_polled: now })));
  await c.from("rbx_snapshots").insert(live.map((g) => ({ universe_id: g.universe_id, playing: g.playing, visits: g.visits, favorites: g.favorites, up_votes: g.up_votes, down_votes: g.down_votes })));
}

type PulseGame = { id: number; name: string; creator: string | null; icon: string | null; genre: string | null; created: string | null; playing: number; prior: number | null };
let pulseCache: { at: number; games: PulseGame[]; series: { t: string; v: number }[] } | null = null;
/** Latest reading of every tracked game (cached 2 min per worker) — the basis for rankings. */
async function pulse() {
  if (pulseCache && Date.now() - pulseCache.at < 120_000) return pulseCache;
  const { data, error } = await db().rpc("rbx_pulse");
  if (error) throw error;
  pulseCache = { at: Date.now(), games: (data as any)?.games ?? [], series: (data as any)?.series ?? [] };
  return pulseCache;
}
const change = (g: PulseGame) => (g.prior && g.prior > 0 ? ((g.playing - g.prior) / g.prior) * 100 : null);

const RANGE_MS: Record<string, number> = { "24h": 864e5, "7d": 6048e5, "30d": 2592e6, "90d": 7776e6, "1y": 31536e6 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return out({ error: "Invalid request" }, 400);
    const b = parsed.data;

    if (b.action === "search") return out({ results: await search(b.q) });

    if (b.action === "pulse") {
      const p = await pulse();
      const withChange = p.games.map((g) => ({ ...g, change: change(g) }));
      const recent = Date.now() - 90 * 864e5;
      return out({
        tracked: p.games.length,
        totalNow: p.games.reduce((s, g) => s + g.playing, 0),
        series: p.series,
        top: withChange.slice(0, 10),
        rising: withChange.filter((g) => g.change != null && (g.prior ?? 0) >= 50).sort((a, b) => b.change! - a.change!).slice(0, 6),
        newest: withChange.filter((g) => g.created && Date.parse(g.created) > recent).slice(0, 6),
        at: new Date(p.at).toISOString(),
      });
    }

    const c = db();
    if (b.action === "poll") {
      // Only the scheduled job knows this key; everyone else is refused.
      const given = req.headers.get("x-job-key") ?? "";
      const { data: key } = await c.from("internal_job_keys").select("secret").eq("name", "rbx-poll").maybeSingle();
      if (!key?.secret || given.length !== key.secret.length || given !== key.secret) return out({ error: "Forbidden" }, 403);
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const { data } = await c.from("rbx_universes").select("universe_id").gte("first_seen", "1970-01-01").order("last_polled").limit(500);
      const ids = (data ?? []).map((r) => r.universe_id);
      for (let i = 0; i < ids.length; i += 50) {
        const live = await fetchLive(ids.slice(i, i + 50)).catch(() => []);
        if (live.length) await record(live);
      }
      return out({ polled: ids.length, since });
    }

    if (GATED_RANGES.has(b.range)) {
      const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
      const { data: { user } } = await anon.auth.getUser(req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "");
      if (!user) return out({ error: "90d and 1y ranges are included with the Starter plan — sign in to continue." }, 401);
      const { data: sub } = await c.from("subscriptions").select("tier,status,current_period_end,stripe_subscription_id").eq("user_id", user.id).maybeSingle();
      if (!meetsTier(sub, "starter")) {
        return out({ error: "90d and 1y ranges are included with the Starter plan ($15/mo) and above." }, 403);
      }
    }
    const [live] = await fetchLive([b.id]);
    if (!live) return out({ error: "Game not found" }, 404);
    const { data: last } = await c.from("rbx_snapshots").select("captured_at").eq("universe_id", b.id).order("captured_at", { ascending: false }).limit(1).maybeSingle();
    if (!last || Date.now() - new Date(last.captured_at).getTime() > MIN_GAP_MS) await record([live]);
    else await c.from("rbx_universes").upsert(universeRow(live));

    const from = new Date(Date.now() - RANGE_MS[b.range]).toISOString();
    const { data: history } = await c.from("rbx_snapshots").select("captured_at,playing,visits,favorites,up_votes,down_votes")
      .eq("universe_id", b.id).gte("captured_at", from).order("captured_at").limit(5000);
    const { data: meta } = await c.from("rbx_universes").select("first_seen").eq("universe_id", b.id).maybeSingle();
    const ranked = await pulse().catch(() => null);
    const pos = ranked ? ranked.games.filter((g) => g.id !== b.id && g.playing > live.playing).length + 1 : null;
    const rank = ranked && ranked.games.length ? { rank: pos, of: Math.max(ranked.games.length, pos ?? 0) } : null;
    return out({ game: live, history: history ?? [], trackedSince: meta?.first_seen ?? null, rank });
  } catch (e) {
    console.error("[rbx]", e);
    return out({ error: e instanceof Error ? e.message : "Failed" }, 500);
  }
});
