import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { searchGames, compact, type SearchHit } from "@/lib/rbx";

export function GameSearch({ large = false, autoFocus = false }: { large?: boolean; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits([]); setErr(null); return; }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try { const r = await searchGames(term); if (id === seq.current) { setHits(r); setErr(r.length ? null : "No games found"); } }
      catch { if (id === seq.current) setErr("Search is unavailable right now"); }
      finally { if (id === seq.current) setBusy(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const go = (h: SearchHit) => { setOpen(false); nav(`/games/${h.universeId}`); };

  return (
    <div className="relative w-full" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <form onSubmit={(e) => { e.preventDefault(); if (hits[0]) go(hits[0]); }}
        className={`flex items-center gap-3 border border-input bg-card px-4 focus-within:border-foreground ${large ? "h-16" : "h-11"}`}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} autoFocus={autoFocus}
          maxLength={200} aria-label="Search any Roblox game" placeholder="Search any Roblox game, or paste a game link…"
          className={`w-full bg-transparent outline-none placeholder:text-muted-foreground ${large ? "text-base md:text-lg" : "text-sm"}`} />
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </form>
      {open && (hits.length > 0 || err) && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-auto border border-border bg-popover shadow-2xl" role="listbox">
          {err && !hits.length && <li className="px-4 py-3 text-sm text-muted-foreground">{err}</li>}
          {hits.map((h) => (
            <li key={h.universeId}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(h)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary">
                {h.icon ? <img src={h.icon} alt="" className="h-9 w-9 shrink-0 bg-muted" loading="lazy" /> : <span className="h-9 w-9 shrink-0 bg-muted" />}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm">{h.name}</span>{h.creator && <span className="block truncate text-xs text-muted-foreground">by {h.creator}</span>}</span>
                <span className="shrink-0 font-mono text-xs text-neon">{compact(h.playing)} live</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
