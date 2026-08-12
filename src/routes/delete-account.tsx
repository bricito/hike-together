```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [{ title: "Suppression du compte — BlablaHike" }],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl pb-24 md:pb-12">
        <h1 className="font-display text-4xl mb-2">
          Suppression du compte
        </h1>

        <p className="text-muted-foreground mb-10">
          Dernière mise à jour : août 2026
        </p>

        <Section title="1. Comment supprimer votre compte ?">
          <p>
            Vous pouvez supprimer votre compte BlablaHike directement depuis
            l'application.
          </p>

          <p>
            Pour cela, connectez-vous à votre compte, ouvrez votre profil puis
            sélectionnez l'option{" "}
            <strong>« Supprimer mon compte »</strong>.
          </p>

          <p>
            La suppression du compte entraîne la suppression des données
            personnelles associées à votre compte, sous réserve des données
            qui doivent être conservées pour des raisons légales ou de
            sécurité.
          </p>
        </Section>

        <Section title="2. Données supprimées">
          <p>
            Lorsque votre compte est supprimé, les données personnelles
            associées à celui-ci sont supprimées ou anonymisées, dans la mesure
            du possible.
          </p>

          <p>
            Cela peut notamment concerner les informations de profil, l'adresse
            email, la photo de profil, les informations d'authentification,
            les données de localisation associées au compte et les contenus
            personnels associés à votre compte.
          </p>
        </Section>

        <Section title="3. Données pouvant être conservées">
          <p>
            Certaines données peuvent être conservées lorsque leur conservation
            est nécessaire pour respecter une obligation légale, prévenir la
            fraude, assurer la sécurité du service ou résoudre un litige.
          </p>

          <p>
            Ces données sont conservées uniquement pendant la durée nécessaire
            à la finalité concernée.
          </p>
        </Section>

        <Section title="4. Délai de suppression">
          <p>
            La suppression du compte est effectuée lorsque l'utilisateur
            confirme la suppression depuis l'application.
          </p>

          <p>
            Certaines données peuvent rester temporairement présentes dans les
            sauvegardes techniques avant leur suppression définitive.
          </p>
        </Section>

        <Section title="5. Besoin d'aide ?">
          <p>
            Si vous ne parvenez pas à supprimer votre compte depuis
            l'application ou si vous avez une question concernant vos données
            personnelles, vous pouvez contacter l'administrateur :
          </p>

          <p>
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
```
