import { Link, NavLink, Outlet } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { tierName } from "./kit";

const NAV = [
  ["", "Overview"], ["analytics", "Game Analytics"], ["trending", "Trending"], ["marketplace", "Marketplace"],
  ["creative", "Creative Studio"], ["ab-tests", "A/B Testing"], ["revenue", "Revenue Analytics"],
  ["performance", "Game Performance"], ["competitors", "Competitor Insights"], ["subscription", "Subscription"],
] as const;

export default function ExchangeLayout() {
  const { session, tier, isStaff, signOut } = useSession();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-semibold uppercase">Deadly’s Studio</Link>
            <span className="hidden border-l border-border pl-4 text-xs text-muted-foreground sm:block">Creator Exchange</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="border border-border px-2 py-1 font-mono uppercase">{tierName(tier)}</span>
            {isStaff && <Link to="/admin" className="text-muted-foreground hover:text-foreground">Staff</Link>}
            {session ? (
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            ) : (
              <Button size="sm" asChild className="rounded-none"><Link to="/auth?next=/exchange">Sign in</Link></Button>
            )}
          </div>
        </div>
      </header>
      <div className="grid lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Exchange" className="flex gap-1 overflow-x-auto border-b border-border p-2 lg:min-h-[calc(100vh-3.5rem)] lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={`/exchange${to ? "/" + to : ""}`} end={!to}
              className={({ isActive }) => `whitespace-nowrap px-3 py-2 text-xs transition-colors ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
