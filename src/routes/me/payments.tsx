import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, Clock, CreditCard, Loader2 } from "lucide-react";

export const Route = createFileRoute("/me/payments")({
  component: PaymentsPage,
});

type ConnectStatus = {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
};

function PaymentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const { data: status, isLoading } = useQuery({
    queryKey: ["connect-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch(`/api/connect/status?userId=${user!.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de récupération du statut");
      return data as ConnectStatus;
    },
    // Repolle automatiquement tant que le compte n'est pas pleinement actif
    // (utile juste après le retour de l'onboarding Stripe)
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && !data.payoutsEnabled ? 5000 : false;
    },
  });

  const onboard = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, email: user!.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la configuration");
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl">Mes paiements</h1>

          <Button asChild variant="outline" size="sm">
            <Link to="/me">Retour au profil</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recevoir les paiements de mes randos</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <>
                {!status?.connected && (
                  <div className="rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Compte non configuré</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pour recevoir l'argent de tes randos, configure ton compte de
                          paiement (coordonnées bancaires + vérification d'identité,
                          5 minutes, une seule fois).
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => onboard.mutate()}
                      disabled={onboard.isPending}
                      className="rounded-2xl"
                    >
                      {onboard.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Redirection…
                        </>
                      ) : (
                        "Configurer mes paiements"
                      )}
                    </Button>
                  </div>
                )}

                {status?.connected && !status.payoutsEnabled && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                          Vérification en cours
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                          Ton compte est en cours de vérification par Stripe. Cela peut
                          prendre quelques minutes à quelques jours.
                        </p>
                      </div>
                    </div>
                    {!status.detailsSubmitted && (
                      <Button
                        onClick={() => onboard.mutate()}
                        disabled={onboard.isPending}
                        variant="outline"
                        className="rounded-2xl"
                      >
                        Terminer la configuration
                      </Button>
                    )}
                  </div>
                )}

                {status?.connected && status.payoutsEnabled && (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                          Compte configuré
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
                          Les fonds de tes randos te seront versés automatiquement
                          quelques jours après chaque sortie.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    qc.invalidateQueries({ queryKey: ["connect-status", user?.id] })
                  }
                  className="text-xs text-muted-foreground underline"
                >
                  Rafraîchir le statut
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
      <MobileNav />
    </div>
  );
}
