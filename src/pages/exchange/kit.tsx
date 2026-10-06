import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { atLeast, useSession, type Tier } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { fetchReport, searchGames, type Range as RbxRange } from "@/lib/rbx";

export type Game = {
  id: string; creator_id: string; platform: "roblox" | "uefn"; external_game_id: string; name: string;
  description: string | null; thumbnail_url: string | null; genre: string; is_public: boolean;
};
export type Snapshot = Record<string, any> & { captured_at: string };

export function PageHead({ index, title, desc, children }: { index: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="section-index">{index}</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-border bg-card ${className}`}>
      {title && <h2 className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">{title}</h2>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border-r border-border p-4 last:border-r-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-xl">{value ?? <span className="text-muted-foreground">—</span>}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Unavailable({ what = "This metric" }: { what?: string }) {
  return (
    <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
      {what} has no readings yet. Outrun records a new reading every 10 minutes from the first lookup, so check back shortly.
    </div>
  );
}

export function SignInPrompt({ next }: { next: string }) {
  return (
    <Panel>
      <p className="text-sm text-muted-foreground">Sign in to use this section.</p>
      <Button asChild className="mt-4 rounded-none"><Link to={`/auth?next=${encodeURIComponent(next)}`}>Sign in</Link></Button>
    </Panel>
  );
}

const TIER_NAME: Record<Tier, string> = { guest: "Guest", free: "Free", starter: "Starter", premium: "Premium", enterprise: "Scale" };
export const tierName = (t: Tier) => TIER_NAME[t];

/** UI hint only — every gated action is enforced again by the database. */
export function Gate({ min, children, next }: { min: Tier; children: ReactNode; next: string }) {
  const { tier, session } = useSession();
  if (!session) return <SignInPrompt next={next} />;
  if (atLeast(tier, min)) return <>{children}</>;
  return (
    <Panel>
      <p className="text-sm">Requires the <strong>{TIER_NAME[min]}</strong> plan. You are on {TIER_NAME[tier]}.</p>
      <Button asChild className="mt-4 rounded-none"><Link to="/exchange/subscription">View plans</Link></Button>
    </Panel>
  );
}

export function useMyGames() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["my-games", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("games").select("*").eq("creator_id", session!.user.id).order("created_at");
      if (error) throw error;
      return data as Game[];
    },
  });
}

const pickRange = (sinceIso: string): RbxRange => {
  const d = (Date.now() - new Date(sinceIso).getTime()) / 864e5;
  return d <= 1.01 ? "24h" : d <= 7.01 ? "7d" : d <= 30.01 ? "30d" : d <= 90.01 ? "90d" : "1y";
};

// Owner-connected metrics first; Roblox games fall back to Outrun's public tracking history.
export function useSnapshots(game: Game | undefined, sinceIso: string) {
  return useQuery({
    queryKey: ["snaps", game?.id, game?.external_game_id, sinceIso],
    enabled: !!game,
    queryFn: async (): Promise<Snapshot[]> => {
      const { data, error } = await supabase.from("game_metric_snapshots").select("*").eq("game_id", game!.id).gte("captured_at", sinceIso).order("captured_at");
      if (error) throw error;
      if (data?.length || game!.platform !== "roblox") return data as Snapshot[];
      try {
        const hit = (await searchGames(game!.external_game_id))[0];
        if (!hit) return [];
        const r = await fetchReport(hit.universeId, pickRange(sinceIso));
        const pts = r.history.filter((p) => p.captured_at >= sinceIso);
        const g = r.game;
        if (!pts.length && g) pts.push({ captured_at: new Date().toISOString(), playing: g.playing, visits: g.visits, favorites: g.favorites, up_votes: g.up_votes, down_votes: g.down_votes });
        return pts.map((p) => ({ captured_at: p.captured_at, ccu: p.playing, visits: p.visits, favorites: p.favorites, likes: p.up_votes, dislikes: p.down_votes }));
      } catch { return []; }
    },
  });
}

export const fmt = (n: number | null | undefined, d = 0) =>
  n == null ? null : Intl.NumberFormat("en", { notation: n > 99999 ? "compact" : "standard", maximumFractionDigits: d }).format(n);

export function GamePicker({ games, value, onChange }: { games: Game[]; value?: string; onChange: (id: string) => void }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9 border border-border bg-background px-3 text-sm">
      {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
  );
}

export function NoGames() {
  return (
    <Panel><p className="text-sm text-muted-foreground">Add a game on the <Link className="underline" to="/exchange">Overview</Link> page first.</p></Panel>
  );
}
