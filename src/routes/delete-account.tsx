import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      {
        title: "Supprimer mon compte — BlablaHike",
      },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Supprimer mon compte
          </h1>

          <p className="mt-4 text-muted-foreground">
            Vous pouvez demander la suppression de votre compte BlablaHike et
            de vos données personnelles.
          </p>

          <div className="mt-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold">
                Suppression du compte
              </h2>

              <p className="mt-2 text-muted-foreground">
                La suppression de votre compte entraîne la suppression des
                données personnelles associées à votre compte, sous réserve
                des données que nous sommes légalement tenus de conserver.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                Comment demander la suppression ?
              </h2>

              <p className="mt-2 text-muted-foreground">
                Pour demander la suppression de votre compte, contactez-nous
                depuis l’adresse e-mail associée à votre compte BlablaHike en
                précisant que vous souhaitez supprimer votre compte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                Après votre demande
              </h2>

              <p className="mt-2 text-muted-foreground">
                Nous vérifierons votre demande et procéderons à la suppression
                de votre compte et des données concernées dans les meilleurs
                délais.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
      <MobileNav />
    </div>
  );
}
