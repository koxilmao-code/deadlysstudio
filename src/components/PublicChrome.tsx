import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="studio-shell flex h-16 items-center justify-between">
        <Link to="/" className="text-sm font-semibold uppercase">Deadly’s Studio</Link>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground md:gap-6" aria-label="Main navigation">
          <Link to="/#work" className="hidden transition-colors hover:text-foreground sm:inline">Work</Link>
          <Link to="/#team" className="hidden transition-colors hover:text-foreground sm:inline">Studio</Link>
          <Link to="/review" className="transition-colors hover:text-foreground">Free review</Link>
          <Link to="/jobs" className="transition-colors hover:text-foreground">Careers</Link>
          <Button asChild variant="outline" size="sm" className="hidden rounded-none border-foreground bg-transparent px-4 text-foreground hover:bg-foreground hover:text-background lg:inline-flex">
            <a href="mailto:hello@deadlystudio.dev">Start a project <ArrowUpRight /></a>
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
        <p>© 2026 Deadly’s Studio. All rights reserved.</p>
        <div className="flex gap-5">
          <Link to="/review" className="transition-colors hover:text-foreground">Free game review</Link>
          <Link to="/jobs" className="transition-colors hover:text-foreground">Careers</Link>
          <Link to="/admin" className="transition-colors hover:text-foreground">Staff access</Link>
        </div>
      </div>
    </footer>
  );
}