import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/safety")({
  head: () => ({ meta: [{ title: "Sécurité — BlablaHike" }] }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl pb-24 md:pb-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <Shield className="h-5 w-5" />
          </span>
          <h1 className="font-display text-4xl">Sécurité & Responsabilité</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-2xl">Principes généraux</h2>
            <p className="text-muted-foreground leading-relaxed">
              BlablaHike est une plateforme de mise en relation entre passionnés de randonnée. Chaque
              sortie est organisée par un particulier à titre bénévole ou associatif. En participant,
              vous reconnaissez que la randonnée est une activité de plein air comportant des risques
              naturels et acceptez d'en être personnellement responsable.
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-2xl">Décharge de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              La participation à toute randonnée organisée via BlablaHike implique l'acceptation des
              conditions suivantes :
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>La randonnée expose les participants à des risques inhérents à la pratique en plein air : conditions météorologiques changeantes, terrain irrégulier ou accidenté, fatigue physique, etc. Chaque participant s'engage en connaissance de ces risques.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Chaque participant déclare être en condition physique adaptée à la sortie choisie et disposer du matériel approprié (chaussures, eau, vêtements de saison, etc.).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>L'organisateur agit en tant que particulier ou facilitateur. Il n'est ni un professionnel de l'encadrement sportif ni un guide breveté, sauf mention explicite dans la description de la sortie.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Chaque participant renonce, dans les limites autorisées par la loi applicable, à tout recours contre l'organisateur en cas d'accident, de blessure ou de dommage survenu lors de la randonnée, sauf en cas de faute lourde ou intentionnelle.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Chaque participant s'engage à adopter un comportement prudent, à respecter les consignes de sécurité de l'organisateur et à ne pas mettre en danger les autres membres du groupe.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-2xl">Recommandations pratiques</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Consultez les prévisions météo avant chaque sortie et n'hésitez pas à reporter si les conditions sont défavorables.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Prévenez un proche de votre itinéraire et de l'heure estimée de retour.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Emportez toujours de l'eau, une trousse de premiers secours légère et un téléphone chargé.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Respectez l'environnement naturel : ne laissez aucun déchet, restez sur les sentiers balisés.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>En cas d'urgence en France, composez le 112 (secours en montagne : 04 76 22 22 22).</span></li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-2xl">Acceptation lors de la réservation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lors de chaque demande de participation à une randonnée, il vous sera demandé de confirmer
              que vous avez lu et accepté ces conditions. Cette acceptation est horodatée et conservée
              afin de garantir la transparence et la sécurité de tous les participants.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à la sécurité ou signalement d'un incident,
              contactez-nous à <a href="mailto:admin@blablahike.eu" className="text-primary hover:underline">admin@blablahike.eu</a>.
            </p>
          </section>

        </div>

        <div className="mt-10 text-center">
          <Link to="/hikes" className="text-primary text-sm hover:underline">← Retour aux randonnées</Link>
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
