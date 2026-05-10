import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Mentions légales & CGU — BlablaHike" }] }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl pb-24 md:pb-12">
        <h1 className="font-display text-4xl mb-2">Mentions légales</h1>
        <p className="text-muted-foreground mb-10">Dernière mise à jour : mai 2026</p>

        <Section title="Éditeur du site">
          <p>Le site <strong>blablahike.eu</strong> est édité par :</p>
          <p className="mt-2">Email : <a href="mailto:admin@blablahike.eu" className="text-primary hover:underline">admin@blablahike.eu</a></p>
        </Section>

        <Section title="Hébergement">
          <p>Le site est hébergé par :</p>
          <p className="mt-2"><strong>Hostinger International Ltd</strong><br />61 Lordou Vironos Street<br />6023 Larnaca, Chypre</p>
        </Section>

        <h2 className="font-display text-3xl mt-14 mb-6">Conditions Générales d'Utilisation (CGU)</h2>

        <Section title="Article 1 — Objet">
          <p>Le site blablahike.eu permet à des utilisateurs majeurs d'organiser et rejoindre des randonnées entre particuliers avec participation aux frais de transport ou d'organisation. La plateforme agit uniquement comme intermédiaire technique entre utilisateurs.</p>
        </Section>

        <Section title="Article 2 — Acceptation des CGU">
          <p>L'utilisation du site implique l'acceptation pleine et entière des présentes CGU. Lors de l'inscription, l'utilisateur reconnaît avoir pris connaissance des présentes conditions.</p>
        </Section>

        <Section title="Article 3 — Conditions d'accès">
          <p>L'utilisation de la plateforme est réservée aux personnes âgées d'au moins 18 ans. L'utilisateur peut créer un compte via email ou via authentification Google. L'utilisateur s'engage à fournir des informations exactes et à jour.</p>
        </Section>

        <Section title="Article 4 — Fonctionnement du service">
          <p>Les utilisateurs peuvent créer des randonnées, rejoindre une randonnée, proposer une participation financière aux frais et échanger via la plateforme. Les montants demandés correspondent à une participation aux frais librement fixée par l'organisateur.</p>
          <p className="mt-2">La plateforme prélève une commission de <strong>10 %</strong> du montant demandé, avec un minimum de <strong>0,50 €</strong>. Cette commission permet le fonctionnement et la maintenance du service.</p>
        </Section>

        <Section title="Article 5 — Paiements">
          <p>Les paiements sont traités par <strong>Stripe</strong>. Les données bancaires ne transitent pas directement par blablahike.eu.</p>
          <p className="mt-2"><strong>Remboursement :</strong> Un participant peut demander un remboursement jusqu'à 24 heures avant le début de l'événement. Passé ce délai, aucun remboursement ne pourra être exigé et l'organisateur conserve les sommes versées.</p>
        </Section>

        <Section title="Article 6 — Responsabilité et sécurité">
          <p>Chaque utilisateur participe aux randonnées sous sa propre responsabilité. Lors de l'inscription ou de la participation à une randonnée, les utilisateurs reconnaissent que l'organisateur ne peut être tenu responsable d'un accident, que la plateforme ne fournit aucune assurance et que chaque participant doit vérifier sa propre couverture d'assurance personnelle.</p>
          <p className="mt-2">La plateforme ne peut être tenue responsable des accidents, blessures, pertes matérielles, comportements des utilisateurs, annulations ou litiges entre participants. Les utilisateurs s'engagent à adopter un comportement respectueux et prudent.</p>
        </Section>

        <Section title="Article 7 — Contenus publiés">
          <p>Les utilisateurs peuvent uniquement publier des randonnées et informations associées. Sont interdits : contenus illégaux, contenus haineux ou discriminatoires, fausses informations, activités dangereuses ou interdites par la loi. L'éditeur se réserve le droit de supprimer tout contenu ou compte non conforme.</p>
        </Section>

        <Section title="Article 8 — Suppression ou suspension de compte">
          <p>Le site peut suspendre ou supprimer un compte en cas de fraude, de non-respect des CGU, de comportement abusif ou d'activité illégale.</p>
        </Section>

        <Section title="Article 9 — Propriété intellectuelle">
          <p>Le contenu du site, son design, sa structure et son code sont protégés par le droit applicable. Toute reproduction non autorisée est interdite. Les utilisateurs conservent les droits sur les contenus publiés mais autorisent leur affichage sur la plateforme.</p>
        </Section>

        <Section title="Article 10 — Données personnelles">
          <p>Les données personnelles sont traitées conformément à la <Link to="/privacy" className="text-primary hover:underline">Politique de Confidentialité</Link> disponible sur le site.</p>
        </Section>

        <Section title="Article 11 — Droit applicable">
          <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux juridictions françaises compétentes.</p>
        </Section>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-display text-xl mb-3 text-foreground">{title}</h3>
      <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
