import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Clock, Lock, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { atLeast, useSession } from "@/hooks/useSession";
import {
  avgCcu, changeSince, compact, latestComplete, monthlyRevenue, pctChange, periods, robuxFor, unitFor,
  DEVEX_USD_PER_ROBUX, type GameReport, type Range,
} from "@/lib/rbx";
import { BarsCard, LineCard, type Datum } from "./charts";

const DAY = 864e5;
const UNIT_WORD = { hour: "hour", day: "day", week: "week" } as const;
const usd = (n: number) => `$${n >= 1000 ? compact(n) : n.toFixed(n < 10 ? 2 : 0)}`;
const exact = (n: number) => Math.round(n).toLocaleString();

export function Delta({ v, icon = "arrow", suffix }: { v: number | null; icon?: "arrow" | "trend" | "none"; suffix?: string }) {
  if (v == null || !Number.isFinite(v)) return null;
  const up = v >= 0;
  const I = icon === "trend" ? (up ? TrendingUp : TrendingDown) : up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium tabular ${up ? "text-up" : "text-down"}`}>
      {icon !== "none" && <I className="h-3.5 w-3.5" aria-hidden />}{up ? "+" : ""}{Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)}%
      {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
    </span>
  );
}

function Card({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="terminal-card flex flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-3"><h3 className="text-[15px] font-medium">{title}</h3>{badge}</div>
      {children}
    </section>
  );
}
const Big = ({ children, extra }: { children: ReactNode; extra?: ReactNode }) => (
  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className="text-3xl font-semibold tabular md:text-4xl">{children}</p>{extra}</div>
);
const Sub = ({ children }: { children: ReactNode }) => <p className="mt-1 text-sm text-muted-foreground">{children}</p>;
const Body = ({ children }: { children: ReactNode }) => <div className="mt-5 flex-1">{children}</div>;

function Empty({ children }: { children: ReactNode }) {
  return <div className="flex h-[13.5rem] items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center text-xs leading-relaxed text-muted-foreground md:h-[15.5rem]">{children}</div>;
}
const Collecting = () => <Empty>Outrun records a reading every 10 minutes from the first lookup. This chart fills in as readings arrive.</Empty>;

export function LiveBadge() {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-down/10 px-2.5 py-1 text-xs font-medium text-down"><span className="h-1.5 w-1.5 rounded-full bg-down" />Live</span>;
}

function PaidLock() {
  const { session } = useSession();
  return (
    <div className="flex h-[13.5rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 text-center md:h-[15.5rem]">
      <Lock className="h-4 w-4 text-gold" />
      <p className="max-w-xs text-sm text-muted-foreground">Estimated earnings are included with Starter and above.</p>
      <Button asChild size="sm">{session ? <Link to="/pricing">See plans</Link> : <Link to={`/auth?next=${encodeURIComponent(location.pathname)}`}>Sign in</Link>}</Button>
    </div>
  );
}

export function GameOverview({ report, range, rangeControl }: { report: GameReport; range: Range; rangeControl: ReactNode }) {
  const { session, tier } = useSession();
  const paid = !!session && atLeast(tier, "starter");
  const { game: g, history: h, rank } = report;
  const unit = unitFor(range);
  const hourly = unit === "hour";

  const v = useMemo(() => {
    const ps = periods(h, unit);
    const done = ps.filter((p) => !p.partial);
    const last = latestComplete(ps);
    const prev = done.length > 1 ? done.at(-2)! : null;
    const toBars = (pick: (p: (typeof ps)[number]) => number | null): Datum[] =>
      ps.flatMap((p) => { const x = pick(p); return x == null ? [] : [{ t: p.start, v: x, partial: p.partial }]; });
    return {
      ps, last, prev,
      line: h.map((p) => ({ t: p.captured_at, v: p.playing })),
      change: changeSince(h, range === "24h" ? DAY : Math.min(DAY * 7, DAY * 365), Date.now()),
      growth: pctChange(prev?.avg, last && !last.partial ? last.avg : null),
      avgBars: toBars((p) => Math.round(p.avg)),
      peakBars: toBars((p) => p.peak),
      visitBars: toBars((p) => p.visits),
      revBars: toBars((p) => robuxFor(p.hours) * DEVEX_USD_PER_ROBUX),
      rev: monthlyRevenue(avgCcu(h)),
    };
  }, [h, unit, range]);

  const enough = v.ps.length >= 2;
  const periodWord = UNIT_WORD[unit];
  const lastLabel = v.last ? new Date(v.last.start).toLocaleString([], hourly ? { hour: "numeric" } : { month: "short", day: "numeric" }) : "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Charts group readings by {periodWord}. Hatched bars are still in progress.</p>
        {rangeControl}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Players" badge={<LiveBadge />}>
          <Big extra={<Delta v={v.change} icon="trend" suffix={range === "24h" ? " 24h" : " 7d"} />}>{g.playing.toLocaleString()}</Big>
          <Sub>{rank ? `#${rank.rank.toLocaleString()} of ${rank.of.toLocaleString()} games Outrun tracks` : "Live concurrent players"}</Sub>
          <Body>{v.line.length < 2 ? <Collecting /> : <LineCard data={v.line} hourly={range === "24h"} unitLabel="playing" />}</Body>
        </Card>

        <Card title="Growth">
          {v.growth == null
            ? <><Big>—</Big><Sub>Needs two complete {periodWord}s of readings</Sub></>
            : <><p className={`mt-2 flex items-center gap-1 text-3xl font-semibold tabular md:text-4xl ${v.growth >= 0 ? "text-up" : "text-down"}`}>{v.growth >= 0 ? "▲" : "▼"} {Math.abs(v.growth).toFixed(1)}%</p><Sub>Average players, {lastLabel} vs the {periodWord} before</Sub></>}
          <Body>{enough ? <BarsCard data={v.avgBars} hourly={hourly} unitLabel="avg playing" /> : <Collecting />}</Body>
        </Card>

        <Card title={`Peak players · per ${periodWord}`}>
          <Big>{v.last ? `≈${v.last.peak.toLocaleString()}` : "—"}</Big>
          <Sub>Highest concurrent count {v.last ? `on ${lastLabel}` : ""} · Roblox doesn't publish unique daily players</Sub>
          <Body>{enough ? <BarsCard data={v.peakBars} hourly={hourly} unitLabel="peak" /> : <Collecting />}</Body>
        </Card>

        <Card title="Robux" badge={<span className="rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">Estimate</span>}>
          {paid ? (
            <>
              <Big extra={<span className="text-sm text-muted-foreground">a month</span>}>≈{usd(v.rev.usd)}</Big>
              <Sub>R$ {exact(v.rev.robux)} est. · DevEx value, not verified earnings</Sub>
              <Body>{enough ? <BarsCard data={v.revBars} hourly={hourly} tone="gold" fmt={usd} unitLabel="est." /> : <Collecting />}</Body>
            </>
          ) : (
            <><Big>≈$ ···</Big><Sub>Modelled from player-hours, not verified earnings</Sub><Body><PaidLock /></Body></>
          )}
        </Card>

        <Card title="Session length" badge={<Clock className="h-4 w-4 text-violet" aria-hidden />}>
          <Big>—</Big>
          <Sub>Not available from public Roblox data</Sub>
          <Body><Empty>Roblox only shares session length with a game's owners through Creator Analytics. Outrun doesn't connect to that yet, so we show nothing rather than a guess.</Empty></Body>
        </Card>

        <Card title={`Visits · per ${periodWord}`}>
          <Big extra={<Delta v={pctChange(v.prev?.visits, v.last && !v.last.partial ? v.last.visits : null)} />}>{v.last?.visits != null ? exact(v.last.visits) : "—"}</Big>
          <Sub>{v.last?.visits != null ? `Gained ${lastLabel} · ` : ""}{compact(g.visits)} all-time</Sub>
          <Body>{v.visitBars.length >= 2 ? <BarsCard data={v.visitBars} hourly={hourly} unitLabel="visits" /> : <Collecting />}</Body>
        </Card>
      </div>
      {report.trackedSince && <p className="mt-6 text-xs text-muted-foreground">Tracked by Outrun since {new Date(report.trackedSince).toLocaleDateString()} · new reading every 10 minutes · revenue figures are estimates.</p>}
    </div>
  );
}
