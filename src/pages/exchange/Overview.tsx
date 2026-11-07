import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PLATFORMS, GENRES, type PlatformId } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineCard } from "@/components/analytics/charts";
import { PageHead, Panel, SignInPrompt, tierName, useMyGames, useSnapshots, fmt, type Game } from "./kit";

const DAY_AGO = () => new Date(Date.now() - 864e5).toISOString();

function GameCard({ game }: { game: Game }) {
  const [since] = useState(DAY_AGO);
  const q = useSnapshots(game, since);
  const s = q.data ?? [];
  const pts = s.filter((x) => x.ccu != null).map((x) => ({ t: x.captured_at, v: Number(x.ccu) }));
  const latest = s.at(-1);
  return (
    <Link to="/exchange/analytics" className="terminal-card block p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate font-medium">{game.name}</p>
        <span className="text-xs text-muted-foreground">{PLATFORMS[game.platform].label}</span>
      </div>
      <div className="mt-4 flex gap-8">
        <div><p className="text-xs text-muted-foreground">Players online</p><p className="text-2xl font-semibold tabular">{fmt(latest?.ccu) ?? "…"}</p></div>
        <div><p className="text-xs text-muted-foreground">Total visits</p><p className="text-2xl font-semibold tabular">{fmt(latest?.visits) ?? "…"}</p></div>
      </div>
      <div className="mt-4">
        {pts.length >= 2 ? <LineCard data={pts} hourly /> : <p className="text-xs text-muted-foreground">{q.isLoading ? "Loading…" : "Graph appears after a couple of readings."}</p>}
      </div>
    </Link>
  );
}

const gameSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  description: z.string().trim().max(2000).optional(),
});

export function useCredits() {
  const { session, tier } = useSession();
  return useQuery({
    queryKey: ["credits", session?.user.id, tier],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_usage");
      if (error) throw error;
      return data as { kind: "thumbnail" | "trailer"; used: number; allowance: number; window_start: string }[];
    },
  });
}

export default function Overview() {
  const { session, tier, periodEnd } = useSession();
  const games = useMyGames();
  const credits = useCredits();
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<PlatformId>("roblox");
  const [name, setName] = useState("");
  const [ext, setExt] = useState("");
  const [genre, setGenre] = useState<string>("other");
  const [desc, setDesc] = useState("");

  if (!session) return (<><PageHead index="01 / Overview" title="Creator Exchange" desc="Analytics, creative services, testing and a marketplace for game creators. Roblox today, more platforms soon." /><SignInPrompt next="/exchange" /></>);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const adapter = PLATFORMS[platform];
    const id = adapter.parseExternalId(ext);
    const parsed = gameSchema.safeParse({ name, description: desc || undefined });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!id) return toast.error(`Invalid ${adapter.idLabel}`);
    const { error } = await supabase.from("games").insert({
      creator_id: session.user.id, platform, external_game_id: id, name: parsed.data.name, description: parsed.data.description ?? null, genre,
    });
    if (error) return toast.error(error.message);
    setName(""); setExt(""); setDesc("");
    qc.invalidateQueries({ queryKey: ["my-games"] });
    toast.success("Game added");
  };
  const remove = async (id: string) => {
    if (!confirm("Remove this game? Its requests and tests are removed too.")) return;
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-games"] });
  };

  const thumb = credits.data?.find((c) => c.kind === "thumbnail");
  const trailer = credits.data?.find((c) => c.kind === "trailer");

  return (
    <>
      <PageHead index="01 / Home" title="Your games, at a glance." desc="Live players and visits for every game you add. Open one for the full graphs." />
      <p className="mb-6 text-sm text-muted-foreground">
        <span className="text-foreground">{tierName(tier)} plan</span>
        {periodEnd && tier !== "free" && ` · renews ${new Date(periodEnd).toLocaleDateString()}`}
        {thumb && thumb.allowance > 0 && ` · ${Math.max(thumb.allowance - thumb.used, 0)} of ${thumb.allowance} thumbnails left`}
        {trailer && trailer.allowance > 0 && ` · ${Math.max(trailer.allowance - trailer.used, 0)} of ${trailer.allowance} trailers left`}
        {tier === "free" && <> · <Link className="underline" to="/exchange/subscription">upgrade</Link></>}
      </p>
      {games.data?.length ? (
        <div className="mb-8 grid gap-4 md:grid-cols-2">{games.data.map((g) => <GameCard key={g.id} game={g} />)}</div>
      ) : (
        <Panel className="mb-8">
          <ol className="grid gap-4 text-sm md:grid-cols-3">
            {["Add your Roblox game below.", "We start recording players and visits every 10 minutes.", "Come back in a few hours — your graphs fill in automatically."].map((s, i) => (
              <li key={s}><p className="section-index">0{i + 1}</p><p className="mt-2">{s}</p></li>
            ))}
          </ol>
        </Panel>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Your games">
          {games.data?.length ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase text-muted-foreground"><th className="pb-2">Name</th><th>Platform</th><th>Genre</th><th>ID</th><th /></tr></thead>
              <tbody>{games.data.map((g) => (
                <tr key={g.id} className="border-t border-border">
                  <td className="py-2">{g.name}</td><td>{PLATFORMS[g.platform].label}</td><td className="capitalize">{g.genre}</td>
                  <td className="font-mono text-xs"><a className="hover:underline" href={PLATFORMS[g.platform].gameUrl(g.external_game_id)} target="_blank" rel="noreferrer">{g.external_game_id}</a></td>
                  <td className="text-right"><Button size="sm" variant="ghost" onClick={() => remove(g.id)}>Remove</Button></td>
                </tr>))}</tbody>
            </table>
          ) : <p className="text-sm text-muted-foreground">No games yet. Add your first game to unlock analytics and creative requests.</p>}
          <p className="mt-4 text-xs text-muted-foreground">Public profile: <Link className="underline" to={`/creator/${session.user.id}`}>view</Link></p>
        </Panel>
        <Panel title="Add a game">
          <form onSubmit={add} className="space-y-3">
            <div className="flex gap-2">{Object.values(PLATFORMS).map((p) => (
              <button type="button" key={p.id} disabled={!p.available} onClick={() => setPlatform(p.id)}
                className={`flex-1 border px-3 py-2 text-xs ${platform === p.id ? "border-foreground" : "border-border text-muted-foreground"} disabled:opacity-40`}>
                {p.label}{!p.available && " · soon"}
              </button>))}
            </div>
            <Input placeholder="Game name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120}  />
            <Input placeholder={PLATFORMS[platform].idLabel} value={ext} onChange={(e) => setExt(e.target.value)}  />
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="h-9 w-full border border-border bg-background px-3 text-sm capitalize">
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <Input placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000}  />
            <Button type="submit" className="w-full">Add game</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
