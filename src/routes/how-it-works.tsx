import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import {
  Mountain,
  Users,
  Shield,
  MessageCircle,
  MapPin,
  Star,
  CheckCircle,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksPage,
});

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
        {number}
      </div>

      <h3 className="text-xl font-semibold mb-3">{title}</h3>

      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="mb-4 text-primary">{icon}</div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function HowItWorksPage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="container mx-auto px-4 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/40 text-sm mb-6">
              <Mountain className="h-4 w-4" />
              Le covoiturage… version randonnée
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Comment fonctionne{" "}
              <span className="text-primary">BlablaHike</span> ?
            </h1>

            <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              BlablaHike permet de trouver des compagnons de randonnée,
              exactement comme le principe de BlaBlaCar :
              un organisateur propose une sortie,
              des participants rejoignent l’aventure,
              tout le monde échange via la messagerie,
              puis se retrouve le jour J pour partir ensemble.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <Link
                to="/hikes"
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Découvrir des randonnées
              </Link>

              <Link
                to="/create"
                className="px-6 py-3 rounded-2xl border border-border hover:bg-secondary transition"
              >
                Organiser une randonnée
              </Link>
            </div>
          </div>
        </section>

        {/* ETAPES */}
        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              En 4 étapes simples
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">
              Le fonctionnement est pensé pour être simple,
              sécurisé et convivial.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Step
              number="1"
              title="Un organisateur crée une randonnée"
              description="Il publie le lieu, la date, le niveau de difficulté, le nombre de places disponibles et toutes les informations utiles."
            />

            <Step
              number="2"
              title="Les participants rejoignent"
              description="Les randonneurs intéressés peuvent réserver leur place et échanger avec le groupe via la messagerie intégrée."
            />

            <Step
              number="3"
              title="Tout le monde se retrouve le jour J"
              description="Avant le départ, un système de check-in sécurisé avec QR code permet de confirmer la présence réelle des participants."
            />

            <Step
              number="4"
              title="La randonnée commence"
              description="Les participants profitent ensemble de l’expérience, rencontrent de nouvelles personnes et découvrent de nouveaux sentiers."
            />
          </div>
        </section>

        {/* FONCTIONNALITES */}
        <section className="border-y border-border bg-secondary/20">
          <div className="container mx-auto px-4 py-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Pourquoi utiliser BlablaHike ?
              </h2>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une plateforme conçue pour rendre les randonnées
                plus accessibles, sociales et sécurisées.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Feature
                icon={<Users className="h-8 w-8" />}
                title="Rencontrer des randonneurs"
                text="Partez avec des personnes qui aiment la randonnée comme vous et créez de nouvelles rencontres."
              />

              <Feature
                icon={<MessageCircle className="h-8 w-8" />}
                title="Messagerie intégrée"
                text="Discutez avec les participants avant la randonnée pour organiser le départ et poser vos questions."
              />

              <Feature
                icon={<Shield className="h-8 w-8" />}
                title="Check-in sécurisé"
                text="Le QR code de présence protège les participants et confirme que tout le groupe est bien présent."
              />

              <Feature
                icon={<MapPin className="h-8 w-8" />}
                title="Des randonnées partout"
                text="Découvrez des sentiers partout en France, du débutant au niveau expert."
              />
            </div>
          </div>
        </section>

        {/* SECURITE */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
                <Shield className="h-5 w-5" />
                Sécurité & confiance
              </div>

              <h2 className="text-4xl font-bold mb-6">
                Une expérience plus fiable pour tous
              </h2>

              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  BlablaHike intègre un système de présence sécurisé
                  inspiré des plateformes modernes d’évènements.
                </p>

                <p>
                  Avant le départ, l’organisateur affiche un QR code
                  unique que les participants doivent scanner.
                </p>

                <p>
                  Cela permet de confirmer la présence réelle des
                  participants et de sécuriser l’organisation de la randonnée.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="bg-card border border-border rounded-3xl p-5 flex gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">
                    Présence vérifiée
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Les participants doivent confirmer leur présence
                    avant le départ.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 flex gap-4">
                <Star className="h-6 w-6 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">
                    Avis & réputation
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Après chaque randonnée, les participants peuvent
                    laisser un avis.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 flex gap-4">
                <CreditCard className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">
                    Organisation simplifiée
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Les organisateurs gèrent facilement leurs groupes
                    et leurs départs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-24">
          <div className="rounded-[32px] border border-border bg-gradient-to-br from-primary/10 to-secondary p-10 md:p-16 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Prêt pour votre prochaine randonnée ?
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Rejoignez la communauté BlablaHike et découvrez
              des centaines de randonnées partout en France.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/hikes"
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Explorer les randonnées
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
