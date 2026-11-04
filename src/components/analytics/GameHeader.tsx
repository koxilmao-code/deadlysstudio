import { ArrowUpRight, BadgeCheck, ChevronRight, Gamepad2, Share2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compact, likeRatio, realGenre, type GameReport, type LiveGame } from "@/lib/rbx";

const isNew = (g: LiveGame) => Date.now() - Date.parse(g.created_at_rbx) < 30 * 864e5;
const initial = (s: string | null | undefined) => (s?.trim()[0] ?? "?").toUpperCase();

async function share(name: string) {
  const url = location.href;
  try {
    if (navigator.share) await navigator.share({ title: `${name} · Outrun`, url });
    else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
  } catch { /* user dismissed */ }
}

const RoundBtn = ({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: React.ReactNode }) =>
  href ? (
    <Button asChild variant="secondary" size="icon" className="h-11 w-11 rounded-full" aria-label={label}><a href={href} target="_blank" rel="noreferrer">{children}</a></Button>
  ) : (
    <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" aria-label={label} onClick={onClick}>{children}</Button>
  );

export function GameHeader({ g }: { g: LiveGame }) {
  const genre = realGenre(g.genre);
  return (
    <header className="flex items-start gap-4 md:gap-6">
      {g.icon_url ? <img src={g.icon_url} alt={`${g.name} icon`} className="h-20 w-20 shrink-0 rounded-2xl bg-muted object-cover md:h-28 md:w-28 md:rounded-3xl" />
        : <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted md:h-28 md:w-28" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight md:text-4xl">{g.name}</h1>
          {isNew(g) && <span className="rounded-md bg-chart/15 px-2 py-0.5 text-xs font-medium text-chart">New</span>}
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-[11px] font-medium text-foreground">{initial(g.creator_name)}</span>
          {g.creator_name ?? "Unknown creator"}{g.creator_verified && <BadgeCheck className="h-4 w-4 text-chart" aria-label="Verified" />}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" aria-hidden />Roblox</span>
          {genre && <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" aria-hidden />{genre}</span>}
        </div>
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        <RoundBtn label="Share" onClick={() => share(g.name)}><Share2 className="h-4 w-4" /></RoundBtn>
        <RoundBtn label="Open on Roblox" href={`https://www.roblox.com/games/${g.root_place_id}`}><ArrowUpRight className="h-4 w-4" /></RoundBtn>
      </div>
    </header>
  );
}

export function StatsRow({ report }: { report: GameReport }) {
  const { game: g, rank } = report;
  const ratio = likeRatio(g.up_votes, g.down_votes);
  const items: [string, React.ReactNode, string?][] = [
    ["Playing", compact(g.playing)],
    ["Rank", rank ? <><sup className="mr-0.5 text-sm">#</sup>{rank.rank.toLocaleString()}</> : "—", rank ? `of ${rank.of} tracked` : "not ranked yet"],
    ["Visits", compact(g.visits)],
    ["Likes", ratio == null ? "—" : `${Math.round(ratio)}%`],
    ["Favorites", compact(g.favorites)],
    ["Released", new Date(g.created_at_rbx).getFullYear()],
  ];
  return (
    <dl className="grid grid-cols-3 gap-y-6 py-6 md:grid-cols-6 md:py-8">
      {items.map(([k, val, hint], i) => (
        <div key={k} className={`text-center ${i % 3 ? "border-l border-border" : ""} ${i ? "md:border-l" : ""}`}>
          <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground md:text-sm">{i === 0 && <span className="live-dot" aria-hidden />}{k}</dt>
          <dd className="mt-1 text-xl font-semibold tabular md:text-2xl">{val}</dd>
          {hint && <dd className="text-[11px] text-muted-foreground">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function GamePeople({ g }: { g: LiveGame }) {
  const group = g.creator_type === "Group";
  const href = g.creator_id ? (group ? `https://www.roblox.com/communities/${g.creator_id}` : `https://www.roblox.com/users/${g.creator_id}/profile`) : null;
  const row = (
    <>
      <span className={`grid h-12 w-12 shrink-0 place-items-center text-lg font-semibold ${group ? "rounded-2xl bg-violet/15 text-violet" : "rounded-full bg-secondary"}`}>{initial(g.creator_name)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium">{g.creator_name ?? "Unknown creator"}{g.creator_verified && <BadgeCheck className="h-4 w-4 text-chart" aria-label="Verified" />}</span>
        <span className="block text-sm text-muted-foreground"><span className={group ? "" : "text-gold"}>{group ? "Studio" : "Owner"}</span> · Roblox {group ? "community" : "creator"}</span>
      </span>
      {href && <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />}
    </>
  );
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold md:text-2xl">Who's behind</h2>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-card">{row}</a>
        : <div className="mt-5 flex items-center gap-4 p-3">{row}</div>}
      <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground">Roblox only lists a game's owner publicly. Individual developers and roles inside a studio aren't published, so Outrun doesn't guess them.</p>
    </section>
  );
}
