import { memo } from "react";
import { Link } from "react-router-dom";
import type { PulseGame } from "@/lib/rbx";

const DIGITS = "0123456789";

/** Rolling digit ticker: each digit slides vertically to its new value. */
export const Odometer = memo(function Odometer({ value, className = "" }: { value: number; className?: string }) {
  const text = Math.max(0, Math.round(Number.isFinite(value) ? value : 0)).toLocaleString();
  return (
    <span className={`inline-flex tabular ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => {
        const d = DIGITS.indexOf(ch);
        if (d < 0) return <span key={`s${i}`} aria-hidden>{ch}</span>;
        return (
          <span key={`${text.length - i}`} aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span className="flex flex-col transition-transform duration-700 ease-out" style={{ transform: `translateY(-${d * 10}%)` }}>
              {DIGITS.split("").map((n) => <span key={n} className="h-[1em] leading-none">{n}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
});

const tone = (i: number) => `hsl(var(--race-${(i % 5) + 1}))`;

/** Top 5 live bar race with share-of-tracked-players strip. */
export function TopRace({ games, total }: { games: PulseGame[]; total: number }) {
  const top = games.slice(0, 5);
  const sum = top.reduce((s, g) => s + g.playing, 0);
  const max = top[0]?.playing || 1;
  const share = total > 0 ? Math.round((sum / total) * 100) : 0;

  if (!top.length) return <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No games tracked yet. Search one above to start.</p>;

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground"><Odometer value={sum} className="font-medium text-foreground" /> players, <span className="font-medium text-foreground">{share}%</span> of tracked games</p>
      <div className="mt-3 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
        {top.map((g, i) => <span key={g.id} className="h-full transition-[width] duration-700" style={{ width: `${total ? (g.playing / total) * 100 : 0}%`, background: tone(i) }} />)}
      </div>
      <ol className="mt-5 space-y-4">
        {top.map((g, i) => {
          const w = Math.max(8, (g.playing / max) * 100);
          return (
            <li key={g.id}>
              <Link to={`/games/${g.id}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium group-hover:underline">{g.name}</span>
                  <Odometer value={g.playing} className="shrink-0 text-sm font-medium" />
                </div>
                <div className="relative mt-2 h-8">
                  <div className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `calc(${w}% - 1rem)`, background: `linear-gradient(90deg, hsl(var(--secondary)), ${tone(i)})` }} />
                  <span className="absolute top-0 h-8 w-8 overflow-hidden rounded-lg border-2 bg-secondary transition-[left] duration-700 ease-out"
                    style={{ left: `calc(${w}% - 2rem)`, borderColor: tone(i) }}>
                    {g.icon && <img src={g.icon} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
