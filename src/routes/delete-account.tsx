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

        <Section title="Comment supprimer votre compte ?">
          <p>
            Vous pouvez supprimer votre compte BlablaHike directement depuis
            l'application.
          </p>

          <p>
            Pour cela, connectez-vous à votre compte, ouvrez votre profil puis
            sélectionnez l'option <strong>« Supprimer mon compte »</strong>.
          </p>

          <p>
            La suppression du compte entraîne la suppression des données
            personnelles associées à votre compte, dans la mesure du possible.
          </p>
        </Section>

        <Section title="Données supprimées">
          <p>
            La suppression du compte entraîne notamment la suppression des
            informations personnelles associées au compte, telles que les
            informations de profil, l'adresse email, la photo de profil et les
            données de localisation associées au compte.
          </p>
        </Section>

        <Section title="Données pouvant être conservées">
          <p>
            Certaines données peuvent être conservées lorsque cela est
            nécessaire pour respecter une obligation légale, prévenir la
            fraude, assurer la sécurité du service ou résoudre un litige.
          </p>

          <p>
            Ces données sont conservées uniquement pendant la durée nécessaire
            à la finalité concernée.
          </p>
        </Section>

        <Section title="Besoin d'aide ?">
          <p>
            Pour toute question concernant la suppression de votre compte ou
            vos données personnelles, vous pouvez contacter :
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
