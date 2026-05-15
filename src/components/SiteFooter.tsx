import { Mountain } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
            Trouvez des compagnons de randonnée et découvrez les sentiers près de vous. L'aventure est meilleure ensemble.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Découvrir</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/hikes" className="hover:text-foreground transition-colors">Randonnées près de moi</Link></li>
            <li><Link to="/hikes" className="hover:text-foreground transition-colors">Sentiers populaires</Link></li>
            <li><Link to="/hikes" className="hover:text-foreground transition-colors">Randonnées faciles</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Communauté</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/hikes" className="hover:text-foreground transition-colors">Comment ça marche</Link></li>
            <li><Link to="/safety" className="hover:text-foreground transition-colors">Sécurité</Link></li>
            <li><Link to="/create" className="hover:text-foreground transition-colors">Devenir animateur</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-3">Entreprise</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground transition-colors">À propos</Link></li>
            <li><Link to="/legal" className="hover:text-foreground transition-colors">Mentions légales & CGU</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
            <li><a href="mailto:admin@blablahike.eu" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-10">
        © 2026 BlablaHike · Conçu pour les randonneurs —{" "}
        <Link to="/legal" className="hover:underline">Mentions légales</Link>
        {" · "}
        <Link to="/privacy" className="hover:underline">Confidentialité</Link>
      </p>
    </footer>
  );
}
