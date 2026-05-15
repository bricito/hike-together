import { Link } from "@tanstack/react-router";
import { Clock, TrendingUp, Users, MapPin } from "lucide-react";
import type { HikeView } from "@/lib/hikes-api";

const diffStyles: Record<string, string> = {
  Easy: "bg-primary/10 text-primary",
  Moderate: "bg-accent/30 text-earth",
  Hard: "bg-earth/15 text-earth",
  Expert: "bg-destructive/10 text-destructive",
};
const diffLabels: Record<string, string> = {
  Easy: "Facile",
  Moderate: "Modéré",
  Hard: "Difficile",
  Expert: "Expert",
};

export function HikeCard({ hike }: { hike: HikeView }) {
  return (
    <Link
      to="/hikes/$slug"
      params={{ slug: hike.slug }}
      className="group block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1"
    >
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${diffStyles[hike.difficulty]}`}>
            {diffLabels[hike.difficulty] ?? hike.difficulty}
          </span>
          <div className="flex items-center gap-1.5">
            {hike.priceCents != null && hike.priceCents > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                {(hike.priceCents / 100).toFixed(2)} {hike.currency}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                Gratuit
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
              {hike.spotsLeft} places
            </span>
          </div>
        </div>

        {/* Lieu */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {hike.location}
        </div>

        {/* Titre + date */}
        <h3 className="font-display text-xl text-foreground leading-snug mb-1">{hike.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{hike.date}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{hike.durationHours}h</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{hike.elevationM}m</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{hike.maxParticipants}</span>
        </div>

        {/* Organisateur */}
        <div className="flex items-center gap-2 mt-4">
          <img
            src={hike.organizer.avatar}
            alt={hike.organizer.name}
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="text-xs text-muted-foreground">
            Organisé par <span className="text-foreground font-medium">{hike.organizer.name}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
