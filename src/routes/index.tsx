import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Calendar, Mountain, Compass, Users, Shield } from "lucide-react";
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
      { title: "BlablaHike — Find hiking partners near you" },
      { name: "description", content: "Discover hikes near you and meet outdoor people. Browse community hikes, join trips, or host your own adventure." },
      { property: "og:title", content: "BlablaHike — Hike together" },
      { property: "og:description", content: "Discover hikes near you and meet outdoor people." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured = [] } = useQuery({
    queryKey: ["hikes", "featured"],
    queryFn: () => fetchPublicHikes({ limit: 4 }),
  });
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Misty mountain valley at sunrise" width={1920} height={1280} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/30 to-background" />
        </div>
        <div className="relative container mx-auto px-4 pt-20 pb-32 md:pt-32 md:pb-44 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-medium text-primary border border-border animate-fade-in">
            <Compass className="h-3.5 w-3.5" /> 1,200+ hikers near you this week
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl text-foreground max-w-3xl mx-auto leading-[1.05] animate-fade-up">
            Hike together. <span className="text-primary">Wander further.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "80ms" }}>
            Discover hikes near you and meet outdoor people who share your love for trails, summits and quiet forests.
          </p>

          {/* Search */}
          <div className="mt-10 mx-auto max-w-3xl rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-[var(--shadow-elegant)] p-3 md:p-2 grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 animate-fade-up" style={{ animationDelay: "160ms" }}>
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Where</div>
                <Input placeholder="Anywhere" className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
              </div>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">When</div>
                <Input type="date" className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm" />
              </div>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left">
              <Mountain className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</div>
                <select className="w-full bg-transparent text-sm outline-none">
                  <option>Any level</option><option>Easy</option><option>Moderate</option><option>Hard</option><option>Expert</option>
                </select>
              </div>
            </label>
            <Button asChild size="lg" className="rounded-2xl h-auto md:px-6">
              <Link to="/hikes"><Search className="h-4 w-4" /> Search</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/hikes">Find a hike</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-background/80 backdrop-blur">
              <Link to="/create">Create a hike</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Featured hikes nearby</h2>
            <p className="text-muted-foreground mt-2">Handpicked trips from our community this week.</p>
          </div>
          <Link to="/hikes" className="hidden md:inline text-sm text-primary hover:underline">View all →</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No hikes yet. <Link to="/create" className="text-primary underline">Be the first to host one!</Link></p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((h) => <HikeCard key={h.id} hike={h} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-4xl bg-secondary/60 p-10 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">How BlablaHike works</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">A trusted community of hikers, three simple steps.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
            {[
              { icon: Compass, title: "Discover", text: "Browse hikes near you, anytime, no account needed." },
              { icon: Users, title: "Join a group", text: "Sign up and request to join a hike that matches your level." },
              { icon: Shield, title: "Hike safely", text: "Verified profiles, ratings and a friendly community." },
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
