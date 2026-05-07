import { Mountain } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24 pb-24 md:pb-12 pt-12 bg-secondary/40">
      <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-8 w-8 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </span>
            <span className="font-display text-lg">BlablaHike</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Find hiking partners and discover trails near you. Adventure is better together.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Discover</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Hikes near me</li><li>Popular trails</li><li>Easy hikes</li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Community</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>How it works</li><li>Safety</li><li>Become a host</li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Company</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>About</li><li>Blog</li><li>Contact</li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-10">© 2026 BlablaHike · Made for hikers</p>
    </footer>
  );
}
