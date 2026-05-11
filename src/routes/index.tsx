import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, Calendar, Mountain, Compass, Users, Shield, Navigation } from "lucide-react";
import heroImg from "@/assets/hero-mountains.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeCard } from "@/components/HikeCard";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicHikes } from "@/lib/hikes-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlablaHike — Trouvez des compagnons de randonnée près de vous" },
      { name: "description", content: "Découvrez des randonnées près de vous et rencontrez des amoureux de plein air." },
      { property: "og:title", content: "BlablaHike — Randonnez ensemble" },
      { property: "og:description", content: "Découvrez des randonnées près de vous et rencontrez des amoureux de plein air." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [difficulty, setDifficulty] = useState("All");

  const { data: featured = [] } = useQuery({
    queryKey: ["hikes", "featured"],
    queryFn: () => fetchPublicHikes({ limit: 4 }),
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/hikes",
      search: {
        near: origin.trim() || undefined,
        difficulty: difficulty !== "All" ? difficulty : undefined,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Vallée de montagne brumeuse au lever du soleil" width={1920} height={1280} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/30 to-background" />
        </div>
        <div className="relative container mx-auto px-4 pt-20 pb-32 md:pt-32 md:pb-44 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-medium text-primary border border-border animate-fade-in">
            <Compass className="h-3.5 w-3.5" /> 1 200+ randonneurs près de vous cette semaine
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl text-foreground max-w-3xl mx-auto leading-[1.05] animate-fade-up">
            Randonnez ensemble. <span className="text-primary">Explorez plus loin.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "80ms" }}>
            Découvrez les randonnées près de vous et rencontrez des amoureux de plein air qui partagent votre passion pour les sentiers, les sommets et les forêts silencieuses.
          </p>

          {/* Search */}
          <form onSubmit={onSearch} className="mt-10 mx-auto max-w-3xl rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-[var(--shadow-elegant)] p-3 md:p-2 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-1">
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <Navigation className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Au départ de</div>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Votre ville"
                  className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quand</div>
                <Input type="date" className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
              </div>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <Mountain className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Difficulté</div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="All">Tous les niveaux</option>
                  <option value="Easy">Facile</option>
                  <option value="Moderate">Moyen</option>
                  <option value="Hard">Difficile</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </label>
            <Button type="submit" size="lg" className="rounded-2xl h-auto md:px-6">
              <Search className="h-4 w-4" /> Rechercher
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/hikes">Trouver une randonnée</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-background/80 backdrop-blur">
              <Link to="/create">Créer une randonnée</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Randonnées phares à proximité</h2>
            <p className="text-muted-foreground mt-2">Voyages sélectionnés de notre communauté cette semaine.</p>
          </div>
          <Link to="/hikes" className="hidden md:inline text-sm text-primary hover:underline">Voir tout →</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">Pas encore de randonnées. <Link to="/create" className="text-primary underline">Soyez le premier à en organiser une !</Link></p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((h) => <HikeCard key={h.id} hike={h} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-4xl bg-secondary/60 p-10 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Comment fonctionne BlablaHike</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Une communauté de randonneurs de confiance, trois étapes simples.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
            {[
              { icon: Compass, title: "Découvrir", text: "Parcourez les randonnées près de vous, à tout moment, sans compte requis." },
              { icon: Users, title: "Rejoindre un groupe", text: "Inscrivez-vous et rejoignez une randonnée qui correspond à votre niveau." },
              { icon: Shield, title: "Randonner en sécurité", text: "Profils vérifiés, évaluations et une communauté amicale." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]">
                <span className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <MobileNav />
    </div>
  );
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => {
        console.log("PWA activée");
      })
      .catch((err) => {
        console.error(err);
      });
  });
}
