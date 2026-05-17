import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import {
  Mountain,
  Heart,
  Shield,
  Users,
  Car,
  Trees,
  MapPinned,
} from "lucide-react";

export const Route = createFileRoute("/who-we-are")({
  component: WhoWeArePage,
});

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-3xl p-8">
      <div className="mb-5 text-primary">{icon}</div>

      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function WhoWeArePage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="container mx-auto px-4 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/40 text-sm mb-6">
                <Mountain className="h-4 w-4" />
                L’histoire derrière BlablaHike
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-8">
                Qui sommes-nous ?
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                BlablaHike est né d’une passion pour la randonnée,
                les rencontres humaines et le besoin de rendre
                les sorties en montagne plus simples, plus conviviales
                et plus sécurisées.
              </p>
            </div>
          </div>
        </section>

        {/* HISTOIRE */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid gap-8 lg:grid-cols-2">
            <SectionCard
              icon={<Trees className="h-10 w-10" />}
              title="Une passion depuis toujours"
            >
              <p>
                Depuis tout petit, la randonnée fait partie de ma vie.
                Bébé déjà, mes parents m’emmenaient marcher partout :
                en montagne, en forêt, dans les Alpes ou pendant les vacances.
              </p>

              <p>
                À 18 ans, avec le permis et une voiture,
                j’ai commencé à partir avec mes amis :
                road trips, bivouacs, week-ends improvisés,
                lever de soleil au sommet…
              </p>

              <p>
                La randonnée est vite devenue bien plus qu’un sport :
                un moyen de voyager, de partager
                et de créer des souvenirs.
              </p>
            </SectionCard>

            <SectionCard
              icon={<MapPinned className="h-10 w-10" />}
              title="Le déclic au Canada"
            >
              <p>
                Il y a 6 ans, je suis parti vivre seul au Canada.
                Sans amis sur place, j’ai voulu rencontrer du monde
                grâce à la randonnée.
              </p>

              <p>
                J’ai essayé les groupes Facebook,
                les petites annonces, les clubs,
                les forums… tout ça en pleine période Covid.
              </p>

              <p>
                Mais rien n’était vraiment fiable :
                annulations de dernière minute,
                manque d’organisation,
                personne avec une voiture,
                tarifs flous annoncés seulement après la sortie…
              </p>

              <p>
                J’ai alors réalisé qu’il manquait une vraie plateforme
                moderne et sécurisée pour organiser des randonnées entre particuliers.
              </p>
            </SectionCard>
          </div>
        </section>

        {/* POURQUOI */}
        <section className="border-y border-border bg-secondary/20">
          <div className="container mx-auto px-4 py-24">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
                  <Heart className="h-5 w-5" />
                  Pourquoi BlablaHike existe
                </div>

                <h2 className="text-4xl font-bold mb-6">
                  Ne plus partir seul
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  De retour en France depuis quelques années,
                  j’ai retrouvé mes amis…
                  mais avec le temps, beaucoup ont désormais des enfants,
                  moins de disponibilité,
                  moins de spontanéité.
                </p>
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  En mars dernier, après un long hiver lyonnais,
                  je suis parti randonner seul.
                </p>

                <p>
                  Et au milieu du sentier,
                  je me suis dit :
                  <span className="text-foreground font-medium">
                    {" "}
                    “Ce serait quand même plus sympa de partager ça avec d’autres personnes.”
                  </span>
                </p>

                <p>
                  La randonnée est plus conviviale à plusieurs.
                  Mais elle est aussi plus sécurisée :
                  en cas de blessure ou de problème,
                  quelqu’un peut prévenir les secours.
                </p>

                <p>
                  C’est ce jour-là que j’ai décidé de créer
                  <span className="text-primary font-semibold">
                    {" "}
                    BlablaHike
                  </span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VALEURS */}
        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Nos valeurs
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">
              BlablaHike est pensé avant tout pour les utilisateurs,
              par un utilisateur actif de la plateforme.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card border border-border rounded-3xl p-8">
              <Users className="h-10 w-10 text-primary mb-5" />

              <h3 className="text-2xl font-semibold mb-4">
                Convivialité
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Permettre à chacun de rencontrer de nouvelles personnes,
                découvrir des sentiers
                et partager des expériences humaines.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8">
              <Shield className="h-10 w-10 text-primary mb-5" />

              <h3 className="text-2xl font-semibold mb-4">
                Sécurité
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Profils vérifiés,
                système de notes,
                check-in QR code,
                transparence des participants :
                tout est pensé pour rassurer les utilisateurs.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8">
              <Car className="h-10 w-10 text-primary mb-5" />

              <h3 className="text-2xl font-semibold mb-4">
                Transparence
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Les frais de transport doivent être clairs dès le départ.
                Pas de surprise à la fin de la randonnée.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-24">
          <div className="rounded-[32px] border border-border bg-gradient-to-br from-primary/10 to-secondary p-10 md:p-16 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Rejoignez l’aventure
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Que vous soyez débutant, passionné de montagne,
              voyageur solo ou simplement à la recherche
              de nouvelles rencontres…
              BlablaHike est fait pour vous.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/hikes"
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Découvrir les randonnées
              </Link>

              <Link
                to="/signup"
                className="px-6 py-3 rounded-2xl border border-border hover:bg-secondary transition"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
