import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "À propos — BlablaHike" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl pb-24 md:pb-12">
        <h1 className="font-display text-4xl mb-4">À propos de BlablaHike</h1>

        <p className="text-muted-foreground mb-10 leading-relaxed">
          BlablaHike est une plateforme communautaire dédiée aux passionnés
          de randonnée. Notre objectif est de permettre aux amoureux de la
          nature de rencontrer d’autres randonneurs, organiser des sorties
          facilement et partager des expériences en toute sécurité.
        </p>

        <Section title="Notre mission">
          <p>
            Nous croyons que la randonnée est encore plus enrichissante lorsqu’elle
            est partagée. BlablaHike a été créé pour faciliter les rencontres entre
            randonneurs, encourager les activités de plein air et rendre les sorties
            accessibles à tous les niveaux.
          </p>
        </Section>

        <Section title="Comment fonctionne la plateforme">
          <p>
            Les utilisateurs peuvent créer un profil, publier des randonnées,
            rejoindre des sorties organisées par la communauté et échanger avec
            les autres participants.
          </p>

          <p className="mt-2">
            Chaque randonnée contient des informations détaillées :
            difficulté, distance, durée, nombre de participants et point de rendez-vous.
          </p>
        </Section>

        <Section title="Sécurité et confiance">
          <p>
            La sécurité de la communauté est une priorité. Nous mettons en place
            des outils de modération, des règles communautaires et des systèmes
            de vérification afin de favoriser des échanges respectueux et des
            expériences positives.
          </p>
        </Section>

        <Section title="Pour tous les niveaux">
          <p>
            Que vous soyez débutant, intermédiaire ou randonneur expérimenté,
            BlablaHike vous permet de trouver des sorties adaptées à votre niveau
            et à vos envies.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Une question, une suggestion ou un problème ?
          </p>

          <p className="mt-2">
            Contact :{" "}
            <a
              href="mailto:blablahike07@gmail.com
              className="text-primary hover:underline"
            >
              blablahike07@gmail.com
            </a>
          </p>
        </Section>
      </main>

      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="font-display text-xl mb-3 text-foreground">
        {title}
      </h3>

      <div className="text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}
