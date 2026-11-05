import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compact, fetchPulse, pctChange, type PulseGame } from "@/lib/rbx";
import { LineCard } from "./charts";
import { Delta, LiveBadge } from "./GameOverview";

const exact = (n: number) => Math.round(n).toLocaleString();

function Panel({ title, note, badge, children, className = "" }: { title: string; note?: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`terminal-card flex min-w-0 flex-col p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="text-[15px] font-medium">{title}</h3>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Row({ g, n }: { g: PulseGame; n?: number }) {
  return (
    <li>
      <Link to={`/games/${g.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/70 focus-visible:bg-secondary/70 focus-visible:outline-none">
        {n != null && <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular">{n}</span>}
        {g.icon ? <img src={g.icon} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-lg bg-secondary object-cover" />
          : <span className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{g.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{g.creator ?? "Unknown creator"}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-medium tabular">{compact(g.playing)}</span>
          {g.change != null ? <Delta v={g.change} icon="none" /> : <span className="block text-xs text-muted-foreground">new</span>}
        </span>
      </Link>
    </li>
  );
}

const List = ({ games, ranked, empty }: { games: PulseGame[]; ranked?: boolean; empty: string }) =>
  games.length ? <ol className="mt-4 -mx-2 space-y-0.5">{games.map((g, i) => <Row key={g.id} g={g} n={ranked ? i + 1 : undefined} />)}</ol>
    : <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">{empty}</p>;

function Loading() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Loading live charts">
      <Skeleton className="h-80 rounded-3xl lg:col-span-2" /><Skeleton className="h-80 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

/** Live leaderboard built only from games Outrun already tracks — never presented as all of Roblox. */
export function LivePulse() {
  const q = useQuery({ queryKey: ["rbx-pulse"], queryFn: fetchPulse, staleTime: 120_000, refetchInterval: 300_000 });

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) {
    return (
      <div className="terminal-card flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-muted-foreground">Live charts couldn't load right now.</p>
        <Button size="sm" variant="outline" onClick={() => q.refetch()}><RefreshCw /> Try again</Button>
      </div>
    );
  }

  const p = q.data;
  const series = p.series.map((s) => ({ t: s.t, v: s.v }));
  const dayChange = series.length > 1 ? pctChange(series[0].v, series.at(-1)!.v) : null;
  const updated = new Date(p.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const top = p.top.slice(0, 6);
  const more = p.top.slice(6, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2" title="Players right now" note={`Across ${p.tracked} games Outrun tracks · updated ${updated}`} badge={<LiveBadge />}>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-semibold tabular md:text-5xl">{exact(p.totalNow)}</p>
          <Delta v={dayChange} suffix=" vs 24h ago" />
        </div>
        <div className="mt-6 flex-1">
          {series.length > 1 ? <LineCard data={series} hourly unitLabel="players" />
            : <p className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">The 24-hour chart fills in as hourly readings arrive.</p>}
        </div>
      </Panel>

      <Panel title="Most played" note="Live players · change vs 24h ago">
        <List games={top} ranked empty="No games tracked yet. Search one above to start." />
      </Panel>

      <Panel title="Rising" note="Biggest 24h gains (50+ players a day ago)">
        <List games={p.rising} empty="Not enough day-old readings yet." />
      </Panel>
      <Panel title="New this season" note="Released in the last 90 days">
        <List games={p.newest} empty="No recently released games tracked yet." />
      </Panel>
      <Panel title="Rest of the top 10" note="Ranks 7–10 among tracked games">
        {more.length ? <ol className="mt-4 -mx-2 space-y-0.5">{more.map((g, i) => <Row key={g.id} g={g} n={i + 7} />)}</ol>
          : <List games={[]} empty="More games appear as people search." />}
        <Link to="/#search" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          Look up any game <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </Panel>
    </div>
  );
}
