import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Lock } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { GameSearch } from "@/components/GameSearch";
import { Button } from "@/components/ui/button";
import { atLeast, useSession, type Tier } from "@/hooks/useSession";
import {
  avgCcu, compact, fetchReport, likeRatio, momentum, monthlyRevenue, peakCcu, playerHours, visitsPerDay,
  ROBUX_PER_PLAYER_HOUR, DEVEX_USD_PER_ROBUX, type Point, type Range,
} from "@/lib/rbx";

const RANGES: Range[] = ["24h", "7d", "30d", "90d", "1y"];
const AXIS = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false } as const;

const tick = (r: Range) => (iso: string) => {
  const d = new Date(iso);
  return r === "24h" ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Chart({ title, data, k, range, area, value }: { title: string; data: Point[]; k: keyof Point | "ratio"; range: Range; area?: boolean; value: ReactNode }) {
  const rows = k === "ratio" ? data.map((p) => ({ ...p, ratio: likeRatio(p.up_votes, p.down_votes) })) : data;
  const common = { data: rows, margin: { top: 8, right: 8, left: 0, bottom: 0 } };
  const inner = (
    <>
      <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey="captured_at" tickFormatter={tick(range)} minTickGap={40} {...AXIS} />
      <YAxis tickFormatter={(v) => compact(v)} width={48} domain={["auto", "auto"]} {...AXIS} />
      <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground))" }}
        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 2, fontSize: 12 }}
        labelFormatter={(l) => new Date(l).toLocaleString()} formatter={(v: number) => [k === "ratio" ? `${v?.toFixed(1)}%` : v.toLocaleString(), title]} />
    </>
  );
  return (
    <section className="border border-border bg-card">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs uppercase text-muted-foreground">{title}</h3>
        <span className="font-mono text-sm">{value}</span>
      </div>
      <div className="h-56 p-2">
        {data.length < 2 ? <Collecting /> : (
          <ResponsiveContainer>
            {area ? (
              <AreaChart {...common}>
                <defs><linearGradient id="ccu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--neon-glow))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--neon-glow))" stopOpacity={0} /></linearGradient></defs>
                {inner}<Area type="monotone" dataKey={k} stroke="hsl(var(--neon-glow))" strokeWidth={1.5} fill="url(#ccu)" isAnimationActive={false} />
              </AreaChart>
            ) : (
              <LineChart {...common}>{inner}<Line type="monotone" dataKey={k} stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={false} isAnimationActive={false} /></LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

const Collecting = () => (
  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
    We started tracking this game just now. New data points are added every 10 minutes — the graph fills in from here.
  </div>
);

function Locked({ min, children }: { min: Tier; children: ReactNode }) {
  const { session, tier } = useSession();
  if (session && atLeast(tier, min)) return <>{children}</>;
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 p-4 text-center">
        <Lock className="h-4 w-4" />
        <p className="text-sm">{session ? `Unlock with ${min === "free" ? "a free account" : "Starter — $15/mo"}` : min === "free" ? "Sign in free to unlock" : "Starter plan required"}</p>
        <Button asChild size="sm" className="rounded-none">
          {session ? <Link to="/pricing">See plans</Link> : <Link to={`/auth?next=${encodeURIComponent(location.pathname)}`}>{min === "free" ? "Sign in free" : "Sign in"}</Link>}
        </Button>
      </div>
    </div>
  );
}

const Cell = ({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) => (
  <div className="bg-card p-4"><p className="text-[11px] uppercase text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl">{value}</p>{hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}</div>
);
const pct = (n: number | null) => (n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`);

export default function GameStats() {
  const id = Number(useParams().id);
  const [range, setRange] = useState<Range>("7d");
  const valid = Number.isInteger(id) && id > 0;
  const q = useQuery({ queryKey: ["rbx", id, range], queryFn: () => fetchReport(id, range), enabled: valid, refetchInterval: 120_000, retry: 1 });
  const h = q.data?.history ?? [];
  const m = useMemo(() => {
    const avg = avgCcu(h);
    return { avg, peak: peakCcu(h), hours: playerHours(h), mom: momentum(h), vpd: visitsPerDay(h), rev: monthlyRevenue(avg) };
  }, [h]);
  const g = q.data?.game;
  const ratio = g ? likeRatio(g.up_votes, g.down_votes) : null;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="studio-shell pb-24 pt-24">
        <div className="mb-10 max-w-2xl"><GameSearch /></div>
        {!valid ? <p className="text-muted-foreground">That isn't a valid game.</p>
          : q.isLoading ? <div className="h-96 animate-pulse bg-card" />
          : q.isError || !g ? <p className="text-muted-foreground">We couldn't load this game. {(q.error as Error)?.message}</p>
          : (
          <>
            <header className="grid gap-6 border-b border-border pb-8 md:grid-cols-[auto_1fr_auto] md:items-end">
              {g.icon_url && <img src={g.icon_url} alt={`${g.name} icon`} className="h-24 w-24 border border-border md:h-28 md:w-28" />}
              <div className="min-w-0">
                <p className="section-index">Roblox · {g.genre || "Experience"} · Universe {g.universe_id}</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">{g.name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">by {g.creator_name ?? "Unknown"} · updated {new Date(g.updated_at_rbx).toLocaleDateString()}</p>
              </div>
              <Button asChild variant="outline" className="rounded-none border-foreground bg-transparent">
                <a href={`https://www.roblox.com/games/${g.root_place_id}`} target="_blank" rel="noreferrer">Open on Roblox <ArrowUpRight /></a>
              </Button>
            </header>

            <section className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6" aria-label="Live stats">
              <Cell label="Playing now" value={<span className="text-neon">{g.playing.toLocaleString()}</span>} hint="live CCU" />
              <Cell label={`Peak CCU · ${range}`} value={compact(Math.max(m.peak, g.playing))} />
              <Cell label={`Avg CCU · ${range}`} value={compact(m.avg || g.playing)} />
              <Cell label="Total visits" value={compact(g.visits)} />
              <Cell label="Favorites" value={compact(g.favorites)} />
              <Cell label="Like ratio" value={ratio == null ? "—" : `${ratio.toFixed(1)}%`} hint={`${compact(g.up_votes)} / ${compact(g.down_votes)}`} />
            </section>

            <div className="mt-10 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-medium">Player counts</h2>
              <div className="flex gap-px border border-border bg-border" role="tablist">
                {RANGES.map((r) => (
                  <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase ${range === r ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="mt-4"><Chart title="Concurrent players (CCU)" data={h} k="playing" range={range} area value={`${g.playing.toLocaleString()} now`} /></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Chart title="Total visits" data={h} k="visits" range={range} value={compact(g.visits)} />
              <Chart title="Favorites" data={h} k="favorites" range={range} value={compact(g.favorites)} />
              <Chart title="Like ratio" data={h} k="ratio" range={range} value={ratio == null ? "—" : `${ratio.toFixed(1)}%`} />
            </div>

            <h2 className="mt-14 border-b border-border pb-3 text-xl font-medium">Engagement</h2>
            <div className="mt-4">
              <Locked min="free">
                <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
                  <Cell label={`Play hours · ${range}`} value={compact(m.hours)} hint="time-weighted from CCU samples" />
                  <Cell label="Momentum" value={<span className={m.mom == null ? "" : m.mom >= 0 ? "text-neon" : "text-destructive"}>{pct(m.mom)}</span>} hint="avg CCU, 2nd half vs 1st half" />
                  <Cell label="Visits / day" value={compact(m.vpd)} hint="growth across the window" />
                </div>
              </Locked>
            </div>

            <h2 className="mt-14 border-b border-border pb-3 text-xl font-medium">Estimated revenue</h2>
            <div className="mt-4">
              <Locked min="starter">
                <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
                  <Cell label="Est. monthly Robux" value={`R$ ${compact(m.rev.robux)}`} />
                  <Cell label="Est. monthly USD (DevEx)" value={`$${compact(m.rev.usd)}`} hint={`likely range $${compact(m.rev.low)} – $${compact(m.rev.high)}`} />
                  <Cell label="Est. yearly USD" value={`$${compact(m.rev.usd * 12)}`} />
                </div>
              </Locked>
              <p className="mt-3 text-xs text-muted-foreground">
                Roblox does not publish revenue. Estimates use average CCU × {ROBUX_PER_PLAYER_HOUR} R$ per player-hour, converted at the DevEx rate (${DEVEX_USD_PER_ROBUX}/R$). Treat them as a ballpark, not an exact figure.
              </p>
            </div>

            {q.data?.trackedSince && <p className="mt-10 text-xs text-muted-foreground">Tracked by Outrun since {new Date(q.data.trackedSince).toLocaleString()} · refreshed every 10 minutes.</p>}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
