import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Gauge, SlidersHorizontal, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { GameSearch } from "@/components/GameSearch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { atLeast, useSession } from "@/hooks/useSession";
import { fetchReport, type Range } from "@/lib/rbx";
import { GameAdvanced, RangeTabs } from "@/components/analytics/GameAdvanced";
import { GameOverview } from "@/components/analytics/GameOverview";
import { GameHeader, GamePeople, StatsRow } from "@/components/analytics/GameHeader";

type View = "overview" | "advanced" | "people";
const VIEW_KEY = "outrun:game-view";
const VIEWS: View[] = ["overview", "advanced", "people"];
const readView = (): View => {
  try { const v = localStorage.getItem(VIEW_KEY) as View; return VIEWS.includes(v) ? v : "overview"; } catch { return "overview"; }
};

const TABS: [View, string, typeof Gauge][] = [["overview", "Overview", Gauge], ["advanced", "Advanced", SlidersHorizontal], ["people", "People", Users]];

function Skeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading game">
      <div className="flex gap-5"><div className="h-24 w-24 rounded-3xl bg-card" /><div className="flex-1 space-y-3 pt-2"><div className="h-8 w-2/3 rounded-lg bg-card" /><div className="h-4 w-40 rounded bg-card" /></div></div>
      <div className="mt-10 h-16 rounded-2xl bg-card" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-80 rounded-3xl bg-card" />)}</div>
    </div>
  );
}

export default function GameStats() {
  const nav = useNavigate();
  const { session, tier } = useSession();
  const id = Number(useParams().id);
  const [range, setRange] = useState<Range>("7d");
  const [view, setView] = useState<View>(readView);
  const valid = Number.isInteger(id) && id > 0;
  const q = useQuery({
    queryKey: ["rbx", id, range], queryFn: () => fetchReport(id, range), enabled: valid,
    refetchInterval: 120_000, retry: 1, placeholderData: keepPreviousData,
  });

  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch { /* storage blocked */ } }, [view]);

  const isLocked = useCallback((r: Range) => (r === "90d" || r === "1y") && !atLeast(tier, "starter"), [tier]);
  const pick = useCallback((r: Range) => {
    if (isLocked(r)) nav(session ? "/pricing" : `/auth?next=${encodeURIComponent(location.pathname)}`);
    else setRange(r);
  }, [isLocked, nav, session]);
  const rangeControl = <RangeTabs range={range} onPick={pick} isLocked={isLocked} />;
  const r = q.data;

  return (
    <div className="public-page min-h-screen bg-background">
      <PublicHeader />
      <main className="studio-shell pb-24 pt-32 md:pt-24">
        <div className="mb-10 max-w-xl"><GameSearch /></div>
        {!valid ? <p className="text-muted-foreground">That isn't a valid game.</p>
          : q.isLoading ? <Skeleton />
          : q.isError || !r ? (
            <div className="terminal-card p-8 text-center">
              <p className="text-sm text-muted-foreground">We couldn't load this game right now. {(q.error as Error)?.message}</p>
              <Button className="mt-4" size="sm" onClick={() => q.refetch()}>Try again</Button>
            </div>
          ) : (
          <>
            <GameHeader g={r.game} />
            <Tabs value={view} onValueChange={(v) => setView(v as View)} className="mt-8">
              <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-transparent p-0 md:gap-6">
                {TABS.map(([v, label, Icon]) => (
                  <TabsTrigger key={v} value={v}
                    className="relative gap-2 rounded-none bg-transparent px-2 pb-3 pt-1 text-sm text-muted-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:opacity-100 md:text-base">
                    <Icon className="h-4 w-4" aria-hidden />{label}
                  </TabsTrigger>
                ))}
                {q.isFetching && <span className="ml-auto pb-3 text-xs text-muted-foreground">Updating…</span>}
              </TabsList>
              <TabsContent value="overview" className="mt-0 animate-fade-in">
                <StatsRow report={r} />
                <GameOverview report={r} range={range} rangeControl={rangeControl} />
              </TabsContent>
              <TabsContent value="advanced" className="mt-8 animate-fade-in">
                <GameAdvanced report={r} range={range} rangeControl={rangeControl} />
                {r.trackedSince && <p className="mt-10 text-xs text-muted-foreground">Tracked by Outrun since {new Date(r.trackedSince).toLocaleString()} · refreshed every 10 minutes.</p>}
              </TabsContent>
              <TabsContent value="people" className="mt-0 animate-fade-in"><GamePeople g={r.game} /></TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
