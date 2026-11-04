import { Link, useLocation } from "react-router-dom";
import { BarChart3, Brush, CreditCard, Home, LayoutDashboard, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/hooks/useSession";

const PILLS = [
  { to: "/", label: "Overview" },
  { to: "/#charts", label: "Charts" },
  { to: "/#analytics", label: "Analytics" },
  { to: "/#creative", label: "Creative" },
  { to: "/pricing", label: "Pricing" },
  { to: "/#team", label: "Team" },
];
const RAIL = [
  { to: "/", label: "Home", icon: Home },
  { to: "/#search", label: "Search games", icon: Search },
  { to: "/#charts", label: "Live charts", icon: BarChart3 },
  { to: "/#creative", label: "Creative", icon: Brush },
  { to: "/pricing", label: "Pricing", icon: CreditCard },
  { to: "/#team", label: "Team", icon: Users },
  { to: "/exchange", label: "Dashboard", icon: LayoutDashboard },
];

function useActive() {
  const { pathname, hash } = useLocation();
  return (to: string) => {
    const [p, h] = to.split("#");
    return h ? pathname === p && hash === `#${h}` : pathname === to && !hash;
  };
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-sm font-semibold" aria-label="Outrun Services home">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background"><span className="text-[13px] font-bold">O</span></span>
      <span className="lg:hidden xl:inline">Outrun</span>
    </Link>
  );
}

function Rail() {
  const active = useActive();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-y-0 left-0 z-50 hidden w-[4.5rem] flex-col items-center gap-2 border-r border-border bg-background py-4 lg:flex">
      <Link to="/" className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background" aria-label="Outrun Services home"><span className="text-sm font-bold">O</span></Link>
      {RAIL.map(({ to, label, icon: Icon }) => (
        <Tooltip key={to} delayDuration={150}>
          <TooltipTrigger asChild>
            <Link to={to} aria-label={label}
              className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${active(to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </nav>
  );
}

export function PublicHeader() {
  const { session } = useSession();
  const active = useActive();
  const pills = (
    <>
      {PILLS.map(({ to, label }) => (
        <Link key={to} to={to} aria-current={active(to) ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${active(to) ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {label}
        </Link>
      ))}
    </>
  );
  return (
    <>
      <Rail />
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl lg:left-[4.5rem]">
        <div className="studio-shell flex h-16 items-center justify-between gap-4">
          <div className="lg:hidden"><Logo /></div>
          <nav aria-label="Main navigation" className="hidden items-center gap-0.5 rounded-full border border-border bg-secondary/50 p-1 md:flex">{pills}</nav>
          <Button asChild size="sm" className="h-9 rounded-full px-5">
            {session ? <Link to="/exchange">Dashboard</Link> : <Link to="/auth?next=/exchange">Sign in</Link>}
          </Button>
        </div>
        <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">{pills}</nav>
      </header>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="studio-shell flex flex-col gap-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><Logo /><p>© 2026 Outrun Services. Not affiliated with Roblox Corporation.</p></div>
        <div className="flex flex-wrap gap-5">
          <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link to="/review" className="transition-colors hover:text-foreground">Free game review</Link>
          <Link to="/jobs" className="transition-colors hover:text-foreground">Careers</Link>
          <Link to="/admin" className="transition-colors hover:text-foreground">Staff access</Link>
        </div>
      </div>
    </footer>
  );
}
