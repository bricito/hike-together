import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Mountain } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/$id")({
  component: ProfilePage,
});

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function ProfilePage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-public", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, city, country, hiking_level, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl pb-24 md:pb-10">
        {isLoading || loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : error || !profile ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Profil introuvable.</p>
            <Button asChild variant="link"><Link to="/hikes">Retour aux randonnées</Link></Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-5">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? "Profil"} />
                  <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl truncate">
                    {profile.full_name ?? "Randonneur"}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {(profile.city || profile.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {[profile.city, profile.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {profile.hiking_level && (
                      <Badge variant="secondary" className="gap-1">
                        <Mountain className="h-3 w-3" /> {profile.hiking_level}
                      </Badge>
                    )}
                  </div>
                  {user?.id === profile.id && (
                    <div className="mt-4">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/me">Modifier mon profil</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Biographie</h2>
                {profile.bio ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic">Cet utilisateur n'a pas encore renseigné sa biographie.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
