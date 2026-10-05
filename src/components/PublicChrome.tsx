import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export function PublicHeader() {
  const { session } = useSession();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="studio-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold uppercase"><span className="h-2 w-2 bg-neon" aria-hidden />Outrun Services</Link>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground md:gap-6" aria-label="Main navigation">
          <Link to="/#analytics" className="hidden transition-colors hover:text-foreground md:inline">Analytics</Link>
          <Link to="/#creative" className="hidden transition-colors hover:text-foreground md:inline">Creative</Link>
          <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link to="/#team" className="hidden transition-colors hover:text-foreground sm:inline">Team</Link>
          <Button asChild size="sm" className="rounded-none px-4">
            {session ? <Link to="/exchange">Dashboard</Link> : <Link to="/auth?next=/exchange">Sign in</Link>}
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="studio-shell flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Outrun Services. Not affiliated with Roblox Corporation.</p>
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
