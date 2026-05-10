import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeCard } from "@/components/HikeCard";
import type { Difficulty } from "@/lib/hikes-data";
import { fetchPublicHikes } from "@/lib/hikes-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/hikes/")({
  head: () => ({
    meta: [
      { title: "Découvrir des randonnées — BlablaHike" },
      { name: "description", content: "Parcourez les randonnées communautaires. Filtrez par difficulté, durée et lieu." },
    ],
  }),
  component: HikesPage,
});

const difficulties: ("All" | Difficulty)[] = ["All", "Easy", "Moderate", "Hard", "Expert"];
const diffLabels: Record<string, string> = {
  All: "Tous", Easy: "Facile", Moderate: "Modéré", Hard: "Difficile", Expert: "Expert",
};
const radii = [10, 25, 50, 100];

function HikesPage() {
  const [diff, setDiff] = useState<"All" | Difficulty>("All");
  const [q, setQ] = useState("");
  const [nearInput, setNearInput] = useState("");
  const [nearSearch, setNearSearch] = useState("");
  const [radius, setRadius] = useState(50);

  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ["hikes", diff, q, nearSearch, radius],
    queryFn: () => fetchPublicHikes({
      difficulty: diff,
      search: nearSearch ? undefined : (q || undefined),
      nearLocation: nearSearch || undefined,
      radiusKm: radius,
    }),
  });

  const handleNearSearch = () => setNearSearch(nearInput.trim());
  const clearNear = () => { setNearSearch(""); setNearInput(""); };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="container mx-auto px-4 pt-10 pb-6">
        <h1 className="font-display text-4xl md:text-5xl">Découvrir des randonnées</h1>
        <p className="text-muted-foreground mt-2">Parcourez les randonnées publiques organisées par la communauté.</p>

        {/* Recherche par mot-clé */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un sentier ou un lieu..."
              className="pl-9 h-12 rounded-2xl bg-card"
              disabled={!!nearSearch}
            />
          </div>
        </div>

        {/* Recherche par proximité */}
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> Rechercher près de chez moi
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={nearInput}
              onChange={(e) => setNearInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNearSearch()}
              placeholder="Ex : Villeurbanne, Lyon, Grenoble..."
              className="h-11 rounded-2xl flex-1"
            />
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm"
            >
              {radii.map((r) => <option key={r} value={r}>± {r} km</option>)}
            </select>
            <Button onClick={handleNearSearch} className="h-11 rounded-2xl px-6">
              Rechercher
            </Button>
            {nearSearch && (
              <Button onClick={clearNear} variant="outline" className="h-11 rounded-2xl px-4">
                Effacer
              </Button>
            )}
          </div>
          {nearSearch && (
            <p className="text-xs text-muted-foreground mt-2">
              📍 Randonnées dans un rayon de <span className="font-medium text-foreground">{radius} km</span> autour de <span className="font-medium text-foreground">{nearSearch}</span>
            </p>
          )}
        </div>

        {/* Filtres difficulté */}
        <div className="mt-4 flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                diff === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
              }`}
            >{diffLabels[d]}</button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <p className="text-muted-foreground py-20 text-center">Impossible de charger les randonnées. Réessayez plus tard.</p>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">
            Aucune randonnée trouvée. Essayez d'autres filtres ou <a href="/create" className="text-primary underline">soyez le premier à en créer une</a>.
          </p>
        ) : (
          <>
            {nearSearch && (
              <p className="text-sm text-muted-foreground mb-4">
                {list.length} randonnée{list.length > 1 ? "s" : ""} trouvée{list.length > 1 ? "s" : ""} près de <span className="font-medium text-foreground">{nearSearch}</span>
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((h) => (
                <div key={h.id} className="relative">
                  {h.distanceKm !== undefined && (
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-xs font-medium bg-background/90 backdrop-blur border border-border">
                      📍 {h.distanceKm} km
                    </span>
                  )}
                  <HikeCard hike={h} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
