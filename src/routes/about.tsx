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
        <h1 className="font-display text-4xl mb-4">
          À propos de BlablaHike
        </h1>

        <p className="text-muted-foreground mb-10 leading-relaxed">
          BlablaHike est une plateforme communautaire qui met en relation des
          passionnés de randonnée. Que vous souhaitiez découvrir de nouveaux
          sentiers, rencontrer d'autres randonneurs ou organiser vos propres
          sorties, BlablaHike vous aide à trouver facilement des personnes
          partageant les mêmes envies.
        </p>

        <Section title="Notre mission">
          <p>
            Nous croyons que la randonnée est une expérience encore plus
            enrichissante lorsqu'elle est partagée. Notre objectif est de
            faciliter les rencontres entre randonneurs, encourager les
            activités de plein air et permettre à chacun de profiter de sorties
            adaptées à son niveau.
          </p>
        </Section>

        <Section title="Comment fonctionne la plateforme">
          <p>
            Les membres de la communauté peuvent créer un profil, proposer leurs
            propres randonnées ou rejoindre celles publiées par d'autres
            utilisateurs.
          </p>

          <p className="mt-2">
            Chaque sortie dispose d'une page dédiée avec toutes les informations
            utiles : niveau de difficulté, distance, durée estimée, point de
            rendez-vous, nombre de participants et éventuels frais de partage.
          </p>

          <p className="mt-2">
            Les participants peuvent ensuite échanger et s'organiser plus
            facilement avant la randonnée.
          </p>
        </Section>

        <Section title="Partage des frais">
          <p>
            Certaines sorties peuvent nécessiter des frais liés au déplacement,
            tels que l'essence, les péages, le stationnement ou d'autres coûts
            directement associés à l'organisation de la randonnée.
          </p>

          <p className="mt-2">
            BlablaHike permet aux participants de partager ces dépenses de façon
            simple et transparente afin de faciliter l'organisation des sorties.
          </p>
        </Section>

        <Section title="Une plateforme gratuite">
          <p>
            L'inscription, la création de sorties, la recherche de randonnées
            et les échanges entre membres sont entièrement gratuits pour tous les
            utilisateurs.
          </p>

          <p className="mt-2">
            Pour assurer le développement et le fonctionnement de la plateforme,
            BlablaHike se rémunère uniquement en prélevant une commission sur les
            montants versés dans le cadre du partage des frais entre
            participants.
          </p>

          <p className="mt-2">
            Ainsi, les utilisateurs ne paient que lorsqu'ils participent à un
            partage de frais, tandis que l'accès à la plateforme reste gratuit
            pour l'ensemble de la communauté.
          </p>
        </Section>

        <Section title="Pourquoi utiliser BlablaHike ?">
          <p>
            Trouver des partenaires de randonnée n'est pas toujours simple.
            BlablaHike permet de rencontrer d'autres passionnés, découvrir de
            nouveaux itinéraires et partager des expériences dans une ambiance
            conviviale.
          </p>

          <p className="mt-2">
            Que vous recherchiez une sortie occasionnelle ou des compagnons de
            randonnée réguliers, la plateforme vous aide à créer des liens
            autour d'une passion commune.
          </p>
        </Section>

        <Section title="Sécurité et confiance">
          <p>
            Nous accordons une grande importance à la qualité des échanges au
            sein de la communauté. Des règles de bonne conduite et des outils de
            modération contribuent à maintenir un environnement respectueux et
            agréable pour tous les membres.
          </p>
        </Section>

        <Section title="Pour tous les niveaux">
          <p>
            Débutant, intermédiaire ou randonneur expérimenté, chacun peut
            trouver des sorties correspondant à ses capacités, ses objectifs et
            ses envies d'aventure.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Une question, une suggestion ou un problème ? N'hésitez pas à nous
            contacter.
          </p>

          <p className="mt-2">
            Contact :{" "}
            <a
              href="mailto:blablahike07@gmail.com"
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
