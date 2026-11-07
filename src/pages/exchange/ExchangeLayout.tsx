import { Link, NavLink, Outlet } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { tierName } from "./kit";

const GROUPS: [string, [string, string][]][] = [
  ["My games", [["", "Home"], ["analytics", "Analytics"], ["revenue", "Revenue"], ["performance", "Health"]]],
  ["Discover", [["trending", "Trending"], ["competitors", "Compare games"], ["marketplace", "Marketplace"]]],
  ["Creative", [["creative", "Thumbnails & trailers"], ["creative/icon-studio", "Icon Studio"], ["ab-tests", "A/B tests"]]],
  ["Account", [["subscription", "Plan"]]],
];

const link = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`;

export default function ExchangeLayout() {
  const { session, tier, isStaff, signOut } = useSession();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="studio-shell flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold" aria-label="Outrun Services home">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background"><span className="text-[13px] font-bold">O</span></span>
            <span>Outrun</span>
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden rounded-full border border-border px-3 py-1 sm:inline">{tierName(tier)} plan</span>
            {isStaff && <Link to="/admin" className="px-2 text-muted-foreground hover:text-foreground">Staff</Link>}
            {session ? <Button size="sm" variant="ghost" className="rounded-full" onClick={signOut}>Sign out</Button>
              : <Button size="sm" asChild className="h-9 rounded-full px-5"><Link to="/auth?next=/exchange">Sign in</Link></Button>}
          </div>
        </div>
      </header>
      <div className="studio-shell grid gap-8 lg:grid-cols-[12rem_1fr] lg:py-10">
        <nav aria-label="Dashboard" className="-mx-1 flex gap-1 overflow-x-auto py-3 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:py-0">
          {GROUPS.map(([g, items]) => (
            <div key={g} className="flex gap-1 lg:mb-5 lg:flex-col">
              <p className="hidden px-3.5 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground lg:block">{g}</p>
              {items.map(([to, label]) => <NavLink key={to} to={`/exchange${to ? "/" + to : ""}`} end className={link}>{label}</NavLink>)}
            </div>
          ))}
        </nav>
        <main className="min-w-0 pb-16"><Outlet /></main>
      </div>
    </div>
  );
}
