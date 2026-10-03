import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useSession, atLeast } from "@/hooks/useSession";
import { GENRES, PLATFORMS } from "@/lib/platforms";
import { Gate, GamePicker, NoGames, PageHead, Panel, Stat, Unavailable, fmt, useMyGames, useSnapshots, type Game, type Snapshot } from "./kit";

const RANGES = { "24H": 1, "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
type Range = keyof typeof RANGES | "CUSTOM";

function useRange() {
  const [range, setRange] = useState<Range>("30D");
  const [from, setFrom] = useState("");
  const since = useMemo(() => {
    if (range === "CUSTOM" && from) return new Date(from).toISOString();
    const d = RANGES[range === "CUSTOM" ? "30D" : range];
    return new Date(Date.now() - d * 864e5).toISOString();
  }, [range, from]);
  const ui = (
    <div className="flex flex-wrap items-center gap-1">
      {(["24H", "7D", "30D", "90D", "1Y", "CUSTOM"] as Range[]).map((r) => (
        <button key={r} onClick={() => setRange(r)} className={`border px-2 py-1 font-mono text-[11px] ${range === r ? "border-foreground" : "border-border text-muted-foreground"}`}>{r}</button>
      ))}
      {range === "CUSTOM" && <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-7 border border-border bg-background px-2 text-xs" />}
    </div>
  );
  return { since, ui };
}

const last = (s: Snapshot[], k: string) => [...s].reverse().find((x) => x[k] != null)?.[k] ?? null;
const sum = (s: Snapshot[], k: string) => (s.some((x) => x[k] != null) ? s.reduce((a, x) => a + Number(x[k] ?? 0), 0) : null);
const pct = (v: number | null) => (v == null ? null : `${(Number(v) * 100).toFixed(1)}%`);
/** Change between first and last snapshot in the window; null when not enough data. */
const delta = (s: Snapshot[], k: string) => {
  const pts = s.filter((x) => x[k] != null);
  if (pts.length < 2 || !Number(pts[0][k])) return null;
  return `${(((Number(pts[pts.length - 1][k]) - Number(pts[0][k])) / Number(pts[0][k])) * 100).toFixed(1)}% vs start`;
};

function Chart({ data, keys }: { data: Snapshot[]; keys: string[] }) {
  const usable = keys.filter((k) => data.some((d) => d[k] != null));
  if (data.length < 2 || !usable.length) return <Unavailable what="Trend data" />;
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data.map((d) => ({ ...d, t: new Date(d.captured_at).toLocaleDateString() }))}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          {usable.map((k, i) => <Line key={k} dataKey={k} dot={false} stroke={i ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))"} strokeWidth={1.5} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsView({ mode }: { mode: "analytics" | "revenue" | "performance" }) {
  const games = useMyGames();
  const { tier } = useSession();
  const [gid, setGid] = useState<string>();
  const { since, ui } = useRange();
  const id = gid ?? games.data?.[0]?.id;
  const snaps = useSnapshots(id, since).data ?? [];
  const meta = {
    analytics: ["02 / Game Analytics", "Game Analytics", "free"],
    revenue: ["07 / Revenue", "Revenue Analytics", "starter"],
    performance: ["08 / Performance", "Game Performance", "starter"],
  } as const;
  const [index, title, min] = meta[mode];
  const advanced = atLeast(tier, "starter");

  return (
    <>
      <PageHead index={index} title={title} desc="Figures come only from connected platform data. Anything without a source is marked unavailable.">
        <div className="flex flex-wrap gap-2">{games.data?.length ? <GamePicker games={games.data} value={id} onChange={setGid} /> : null}{ui}</div>
      </PageHead>
      <Gate min={min} next={`/exchange/${mode}`}>
        {!games.data?.length ? <NoGames /> : !snaps.length ? <Unavailable what="Data for this game in this period" /> : (
          <div className="space-y-6">
            {mode === "analytics" && (<>
              <div className="grid grid-cols-2 border border-border bg-card md:grid-cols-5">
                <Stat label="Visits" value={fmt(last(snaps, "visits"))} hint={delta(snaps, "visits") ?? undefined} />
                <Stat label="Concurrent" value={fmt(last(snaps, "ccu"))} />
                <Stat label="Avg session" value={last(snaps, "avg_session_seconds") != null ? `${Math.round(last(snaps, "avg_session_seconds") / 60)}m` : null} />
                <Stat label="New players" value={fmt(sum(snaps, "new_players"))} />
                <Stat label="Returning" value={fmt(sum(snaps, "returning_players"))} />
              </div>
              <Panel title="Visits & concurrent players"><Chart data={snaps} keys={["visits", "ccu"]} /></Panel>
              {advanced ? (<>
                <div className="grid grid-cols-3 border border-border bg-card">
                  <Stat label="D1 retention" value={pct(last(snaps, "d1_retention"))} />
                  <Stat label="D7 retention" value={pct(last(snaps, "d7_retention"))} />
                  <Stat label="D30 retention" value={pct(last(snaps, "d30_retention"))} />
                </div>
                <Panel title="Player engagement"><Chart data={snaps} keys={["new_players", "returning_players"]} /></Panel>
              </>) : <Panel><p className="text-sm text-muted-foreground">Retention and engagement metrics are included from the Starter plan.</p></Panel>}
            </>)}
            {mode === "revenue" && (() => {
              const rev = sum(snaps, "revenue"), payers = sum(snaps, "paying_users"), players = sum(snaps, "new_players");
              return (<>
                <div className="grid grid-cols-2 border border-border bg-card md:grid-cols-4">
                  <Stat label="Revenue" value={fmt(rev, 2)} />
                  <Stat label="Purchases" value={fmt(sum(snaps, "purchases"))} />
                  <Stat label="Revenue / player" value={rev != null && players ? fmt(rev / players, 3) : null} />
                  <Stat label="Conversion" value={payers != null && players ? `${((payers / players) * 100).toFixed(2)}%` : null} />
                </div>
                <Panel title="Revenue over time"><Chart data={snaps} keys={["revenue"]} /></Panel>
              </>);
            })()}
            {mode === "performance" && (
              <Panel title="Game health — direction of each signal across the selected period">
                <table className="w-full text-sm"><tbody>
                  {([["Player growth", "visits"], ["Engagement", "avg_session_seconds"], ["Retention", "d7_retention"], ["Revenue", "revenue"], ["Discovery", "favorites"], ["Creative performance", "likes"]] as const).map(([l, k]) => (
                    <tr key={l} className="border-t border-border first:border-0"><td className="py-2">{l}</td><td className="text-right font-mono text-xs">{delta(snaps, k) ?? <span className="text-muted-foreground">insufficient data</span>}</td></tr>
                  ))}
                </tbody></table>
                <p className="mt-4 text-xs text-muted-foreground">No combined “health score” is shown — each signal is the plain change between the first and last data point.</p>
              </Panel>
            )}
          </div>
        )}
      </Gate>
    </>
  );
}

type Row = Game & { latest?: Snapshot; growth?: number | null };
function usePublicGames() {
  return useQuery({
    queryKey: ["public-games"],
    queryFn: async () => {
      const { data: games, error } = await supabase.from("games").select("*").eq("is_public", true).limit(500);
      if (error) throw error;
      const ids = (games ?? []).map((g) => g.id);
      const { data: snaps } = ids.length
        ? await supabase.from("public_game_metrics").select("*").in("game_id", ids).gte("captured_at", new Date(Date.now() - 14 * 864e5).toISOString()).order("captured_at")
        : { data: [] as any[] };
      return (games as Game[]).map<Row>((g) => {
        const s = (snaps ?? []).filter((x: any) => x.game_id === g.id) as Snapshot[];
        const first = s.find((x) => x.visits != null), latest = s[s.length - 1];
        return { ...g, latest, growth: first && latest?.visits && first.visits && first !== latest ? (latest.visits - first.visits) / first.visits : null };
      });
    },
  });
}

export function Trending() {
  const { tier } = useSession();
  const q = usePublicGames();
  const [platform, setPlatform] = useState("all");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<"growth" | "ccu" | "visits">("ccu");
  const rows = (q.data ?? [])
    .filter((g) => (platform === "all" || g.platform === platform) && (genre === "all" || g.genre === genre))
    .sort((a, b) => Number(sort === "growth" ? b.growth ?? -1e9 : b.latest?.[sort] ?? -1) - Number(sort === "growth" ? a.growth ?? -1e9 : a.latest?.[sort] ?? -1));
  const full = atLeast(tier, "starter");
  const shown = full ? rows : rows.slice(0, 5);
  const Sel = ({ v, set, opts }: { v: string; set: (x: any) => void; opts: [string, string][] }) => (
    <select value={v} onChange={(e) => set(e.target.value)} className="h-9 border border-border bg-background px-3 text-sm">{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
  );
  return (
    <>
      <PageHead index="03 / Trending" title="Trending" desc="Public games on the Exchange, ranked by public metrics.">
        <div className="flex flex-wrap gap-2">
          <Sel v={platform} set={setPlatform} opts={[["all", "All platforms"], ...Object.values(PLATFORMS).map((p) => [p.id, p.label] as [string, string])]} />
          <Sel v={genre} set={setGenre} opts={[["all", "All categories"], ...GENRES.map((g) => [g, g[0].toUpperCase() + g.slice(1)] as [string, string])]} />
          <Sel v={sort} set={setSort} opts={[["ccu", "Player activity"], ["visits", "Popularity"], ["growth", "Momentum (14d)"]]} />
        </div>
      </PageHead>
      <Panel>
        {!shown.length ? <p className="text-sm text-muted-foreground">No public games match these filters yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-muted-foreground"><th className="pb-2">#</th><th>Game</th><th>Platform</th><th>Category</th><th className="text-right">CCU</th><th className="text-right">Visits</th><th className="text-right">14d growth</th></tr></thead>
            <tbody>{shown.map((g, i) => (
              <tr key={g.id} className="border-t border-border">
                <td className="py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                <td><a className="hover:underline" href={PLATFORMS[g.platform].gameUrl(g.external_game_id)} target="_blank" rel="noreferrer">{g.name}</a></td>
                <td>{PLATFORMS[g.platform].label}</td><td className="capitalize">{g.genre}</td>
                <td className="text-right font-mono">{fmt(g.latest?.ccu) ?? "—"}</td>
                <td className="text-right font-mono">{fmt(g.latest?.visits) ?? "—"}</td>
                <td className="text-right font-mono">{g.growth == null ? "—" : `${(g.growth * 100).toFixed(1)}%`}</td>
              </tr>))}</tbody>
          </table>
        )}
        {!full && rows.length > 5 && <p className="mt-4 text-xs text-muted-foreground">Showing top 5. The full trending feed is included from the Starter plan.</p>}
      </Panel>
    </>
  );
}

export function Competitors() {
  const q = usePublicGames();
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const all = q.data ?? [];
  const ga = all.find((g) => g.id === a), gb = all.find((g) => g.id === b);
  const metrics: [string, (g?: Row) => string | null][] = [
    ["Visits", (g) => fmt(g?.latest?.visits)], ["Concurrent players", (g) => fmt(g?.latest?.ccu)],
    ["Favorites", (g) => fmt(g?.latest?.favorites)], ["Likes", (g) => fmt(g?.latest?.likes)],
    ["14-day growth", (g) => (g?.growth == null ? null : `${(g.growth * 100).toFixed(1)}%`)],
  ];
  return (
    <>
      <PageHead index="09 / Competitors" title="Competitor Insights" desc="Compare public games side by side. Only public metrics are shown — private data like revenue and retention never leaves its owner." />
      <Gate min="starter" next="/exchange/competitors">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <GamePicker games={[{ id: "", name: "Select game A" } as Game, ...all]} value={a} onChange={setA} />
          <span className="text-xs text-muted-foreground">vs</span>
          <GamePicker games={[{ id: "", name: "Select game B" } as Game, ...all]} value={b} onChange={setB} />
        </div>
        <Panel>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-muted-foreground"><th className="pb-2">Metric</th><th>{ga?.name ?? "Game A"}</th><th>{gb?.name ?? "Game B"}</th></tr></thead>
            <tbody>{metrics.map(([l, f]) => (
              <tr key={l} className="border-t border-border"><td className="py-2">{l}</td><td className="font-mono">{f(ga) ?? "—"}</td><td className="font-mono">{f(gb) ?? "—"}</td></tr>
            ))}</tbody>
          </table>
        </Panel>
      </Gate>
    </>
  );
}
