import { Link } from "@tanstack/react-router";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="font-display text-xl">BlablaHike</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/hikes" className="hover:text-foreground transition-colors">Discover</Link>
          <Link to="/create" className="hover:text-foreground transition-colors">Create a hike</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">How it works</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
