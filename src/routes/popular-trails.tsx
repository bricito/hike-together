import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/popular-trails")({
  component: PopularTrailsPage,
});

const trails = [
  {
    title: "Tour du Mont Blanc",
    location: "Alpes",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Lac Blanc",
    location: "Chamonix",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Cirque de Gavarnie",
    location: "Pyrénées",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Calanques de Cassis",
    location: "Marseille",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Puy de Dôme",
    location: "Auvergne",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "GR20",
    location: "Corse",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Forêt de Fontainebleau",
    location: "Île-de-France",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Lacs d’Ayous",
    location: "Pyrénées",
    image:
      "https://images.unsplash.com/photo-1431794062232-2a99a5431c6c?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Aiguille du Midi",
    location: "Chamonix",
    image:
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Verdon",
    location: "Provence",
    image:
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1400&auto=format&fit=crop",
  },
];

function PopularTrailsPage() {
  return (
    <div className="min-h-screen bg-background">
      
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <p className="text-primary font-medium mb-4">
              🥾 Les plus beaux sentiers de France
            </p>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Sentiers populaires
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Découvrez les randonnées les plus appréciées par la communauté
              BlablaHike à travers toute la France.
            </p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {trails.map((trail) => (
            <div
              key={trail.title}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={trail.image}
                  alt={trail.title}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-3 py-1">
                    {trail.location}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold mb-3">
                  {trail.title}
                </h2>

                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Une randonnée emblématique idéale pour découvrir les plus beaux paysages naturels français.
                </p>

                <Link
                  to="/hikes"
                  className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                  Voir les randonnées
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-3xl border border-border bg-secondary/40 p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Rejoignez une randonnée près de chez vous
          </h2>

          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Trouvez des compagnons de randonnée, échangez avec la communauté
            et découvrez de nouveaux sentiers chaque semaine.
          </p>

          <Link
            to="/hikes"
            className="inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition"
          >
            Explorer les randonnées
          </Link>
        </div>
      </section>
    </div>
  );
}
