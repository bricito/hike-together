import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mountain } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeCard } from "@/components/HikeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { fetchMyHikes, type HikeView } from "@/lib/hikes-api";

export const Route = createFileRoute("/my-hikes")({
  component: MyHikesPage,
});

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 border border-dashed rounded-2xl">
      <Mountain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-muted-foreground">{label}</p>
      <Button asChild variant="link" className="mt-2">
        <Link to="/hikes">Découvrir des randonnées</Link>
      </Button>
    </div>
  );
}

function HikeGrid({ hikes, empty }: { hikes: HikeView[]; empty: string }) {
  if (hikes.length === 0) return <EmptyState label={empty} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hikes.map((h) => (
        <HikeCard key={h.id} hike={h} />
      ))}
    </div>
  );
}

function MyHikesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-hikes", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyHikes(user!.id),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl">Mes randos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Vos randonnées organisées, acceptées et en attente.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/create">Créer une randonnée</Link>
          </Button>
        </div>

        {isLoading || loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Impossible de charger vos randonnées.</p>
        ) : (
          <Tabs defaultValue="organized" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="organized">
                Organisées ({data?.organized.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Acceptées ({data?.accepted.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({data?.pending.length ?? 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="organized">
              <HikeGrid
                hikes={data?.organized ?? []}
                empty="Vous n'avez encore organisé aucune randonnée."
              />
            </TabsContent>
            <TabsContent value="accepted">
              <HikeGrid
                hikes={data?.accepted ?? []}
                empty="Aucune randonnée acceptée pour le moment."
              />
            </TabsContent>
            <TabsContent value="pending">
              <HikeGrid
                hikes={data?.pending ?? []}
                empty="Aucune demande en attente."
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
