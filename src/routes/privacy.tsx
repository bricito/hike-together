import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — BlablaHike" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl pb-24 md:pb-12">
        <h1 className="font-display text-4xl mb-2">Politique de confidentialité</h1>
        <p className="text-muted-foreground mb-10">Conforme au RGPD — Dernière mise à jour : mai 2026</p>

        <Section title="1. Responsable du traitement">
          <p><strong>Administrateur </strong><br />Email : <a href="mailto:admin@blablahike.eu" className="text-primary hover:underline">admin@blablahike.eu</a></p>
        </Section>

        <Section title="2. Données collectées">
          <p>Le site peut collecter : nom, prénom, adresse email, photo de profil Google, informations de connexion, historique des randonnées, contenus publiés et données liées aux paiements. Les données bancaires sont traitées par Stripe et ne sont pas stockées directement par la plateforme.</p>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Les données sont utilisées afin de créer les comptes utilisateurs, permettre les réservations, gérer les paiements, sécuriser la plateforme, prévenir la fraude, améliorer le service et respecter les obligations légales.</p>
        </Section>

        <Section title="4. Base légale">
          <p>Les traitements reposent sur l'exécution du contrat, le consentement lorsque nécessaire, l'intérêt légitime de sécurisation du service et les obligations légales.</p>
        </Section>

        <Section title="5. Prestataires utilisés">
          <p>Le site utilise notamment : <strong>Hostinger</strong> (hébergement), <strong>Google Sign-In</strong> (authentification) et <strong>Stripe</strong> (paiement). Certains traitements peuvent avoir lieu hors Union européenne conformément aux mécanismes légaux applicables.</p>
        </Section>

        <Section title="6. Conservation des données">
          <p>Les données sont conservées pendant la durée nécessaire au fonctionnement du service. Les comptes inactifs peuvent être supprimés après 24 mois d'inactivité. Certaines données peuvent être conservées afin de respecter les obligations légales.</p>
        </Section>

        <Section title="7. Droits des utilisateurs">
          <p>Conformément au RGPD, chaque utilisateur dispose d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité.</p>
          <p className="mt-2">Toute demande peut être envoyée à : <a href="mailto:blablahike@gmail.com" className="text-primary hover:underline">blablahike@gmail.com</a></p>
          <p className="mt-2">Les utilisateurs peuvent également introduire une réclamation auprès de la <strong>CNIL</strong>.</p>
        </Section>

        <Section title="8. Cookies">
          <p>Le site utilise des cookies nécessaires au fonctionnement et des cookies de mesure d'audience. Lors de la première visite, l'utilisateur peut accepter ou refuser les cookies non essentiels.</p>
        </Section>

        <Section title="9. Sécurité">
          <p>Le site met en œuvre des mesures raisonnables de sécurité afin de protéger les données personnelles. Toutefois, aucun système informatique ne peut garantir une sécurité absolue.</p>
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
