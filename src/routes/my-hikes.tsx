import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mountain, MapPin, Clock, TrendingUp, Archive } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeCard } from "@/components/HikeCard";
import { HikeParticipants } from "@/components/HikeParticipants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { fetchMyHikes, type HikeView } from "@/lib/hikes-api";
import { ReviewSection } from "@/components/ReviewSection";
import { fetchPendingReviews } from "@/lib/reviews-api";

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

function HikeGrid({ hikes, empty, showParticipants }: { hikes: HikeView[]; empty: string; showParticipants?: boolean }) {
  if (hikes.length === 0) return <EmptyState label={empty} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hikes.map((hike) => (
        <div key={hike.id} className="flex flex-col">
          <HikeCard hike={hike} />
          {showParticipants && <HikeParticipants hikeId={hike.id} />}
        </div>
      ))}
    </div>
  );
}

function ArchivedHikeRow({ hike }: { hike: HikeView }) {
  return (
    <Link
      to="/hikes/$slug"
      params={{ slug: hike.slug }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-secondary/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{hike.title}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />{hike.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{hike.durationHours}h
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />{hike.elevationM}m
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">{hike.date}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hike.maxParticipants} participants max
        </p>
      </div>
    </Link>
  );
}

function ArchivedList({ hikes }: { hikes: HikeView[] }) {
  if (hikes.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed rounded-2xl">
        <Archive className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Aucune randonnée archivée pour le moment.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {hikes.map((hike) => (
        <ArchivedHikeRow key={hike.id} hike={hike} />
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

  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["pending-reviews", user?.id],
    queryFn: () => fetchPendingReviews(user!.id),
    enabled: !!user,
  });

  // Hier à minuit
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const activeOrganized = (data?.organized ?? []).filter(
    (h) => new Date(h.starts_at) > yesterday
  );
  const archivedOrganized = (data?.organized ?? []).filter(
    (h) => new Date(h.starts_at) <= yesterday
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl">Mes randos</h1>
            <p className="text-muted-foreground text-sm mt-1">Vos randonnées organisées, acceptées et en attente.</p>
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
          <>
            <Tabs defaultValue="organized" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="organized">
                  Organisées ({activeOrganized.length})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  Acceptées ({data?.accepted.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  En attente ({data?.pending.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archives ({archivedOrganized.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organized">
                <HikeGrid
                  hikes={activeOrganized}
                  empty="Vous n'avez encore organisé aucune randonnée."
                  showParticipants
                />
              </TabsContent>

              <TabsContent value="accepted">
                <HikeGrid
                  hikes={data?.accepted ?? []}
                  empty="Aucune randonnée acceptée pour le moment."
                  showParticipants
                />
              </TabsContent>

              <TabsContent value="pending">
                <HikeGrid
                  hikes={data?.pending ?? []}
                  empty="Aucune demande en attente."
                />
              </TabsContent>

              <TabsContent value="archived">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Archive className="h-4 w-4" />
                  <span>Randonnées passées que vous avez organisées.</span>
                </div>
                <ArchivedList hikes={archivedOrganized} />
              </TabsContent>
            </Tabs>

            <ReviewSection targets={pendingReviews} />
          </>
        )}
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
