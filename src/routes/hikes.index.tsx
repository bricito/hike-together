import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeCard } from "@/components/HikeCard";
import { hikes, type Difficulty } from "@/lib/hikes-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/hikes/")({
  head: () => ({
    meta: [
      { title: "Discover hikes — BlablaHike" },
      { name: "description", content: "Browse upcoming community hikes. Filter by difficulty, duration and date." },
    ],
  }),
  component: HikesPage,
});

const difficulties: ("All" | Difficulty)[] = ["All", "Easy", "Moderate", "Hard", "Expert"];

function HikesPage() {
  const [diff, setDiff] = useState<"All" | Difficulty>("All");
  const [q, setQ] = useState("");

  const list = hikes.filter((h) =>
    (diff === "All" || h.difficulty === diff) &&
    (q === "" || h.title.toLowerCase().includes(q.toLowerCase()) || h.location.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="container mx-auto px-4 pt-10 pb-6">
        <h1 className="font-display text-4xl md:text-5xl">Discover hikes</h1>
        <p className="text-muted-foreground mt-2">Browse public hikes hosted by the community.</p>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trail or location" className="pl-9 h-12 rounded-2xl bg-card" />
          </div>
          <Button variant="outline" className="rounded-2xl h-12 gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                diff === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
              }`}
            >{d}</button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        {list.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">No hikes found. Try different filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((h) => <HikeCard key={h.id} hike={h} />)}
          </div>
        )}
      </section>

      <SiteFooter />
      <MobileNav />
    </div>
  );
}
