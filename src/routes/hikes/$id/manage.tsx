import { createFileRoute } from "@tanstack/react-router";
import { HikeQR } from "@/components/HikeQR";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/lib/auth-context";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/hikes/$id/manage")({
  component: ManagePage,
});

function ManagePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <Shield className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl">Gestion du check-in</h1>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Générez un QR code que les participants scannent au départ de la randonnée pour valider leur présence.
          </p>
          <HikeQR hikeId={id} />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
