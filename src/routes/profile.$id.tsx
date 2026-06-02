import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Mountain,
  Star,
  Calendar,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/$id")({
  component: ProfilePage,
});

function initials(name?: string | null) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function levelLabel(level?: string | null) {
  switch (level) {
    case "beginner":
      return "Débutant";

    case "intermediate":
      return "Intermédiaire";

    case "advanced":
      return "Expert";

    default:
      return level;
  }
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function ProfilePage() {
  const { id } = Route.useParams();

  const { user, loading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile-public", id],

    enabled: !!user,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          bio,
          city,
          country,
          hiking_level,
          participant_badge,
          organizer_badge,
          created_at
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  const {
    data: reviews = [],
  } = useQuery({
    queryKey: ["profile-reviews", id],

    enabled: !!user,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          role,
          reviewer:profiles!reviewer_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("reviewed_user_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data;
    },
  });

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (acc, review) => acc + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl pb-24 md:pb-10">
        {isLoading || loading ? (
          <p className="text-sm text-muted-foreground">
            Chargement…
          </p>
        ) : error || !profile ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Profil introuvable.
            </p>

            <Button asChild variant="link">
              <Link to="/hikes">
                Retour aux randonnées
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={profile.avatar_url ?? undefined}
                      alt={profile.full_name ?? "Profil"}
                    />

                    <AvatarFallback>
                      {initials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl sm:text-3xl truncate">
                      {profile.full_name ?? "Randonneur"}
                    </h1>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {(profile.city || profile.country) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />

                          {[profile.city, profile.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}

                      {profile.hiking_level && (
                        <Badge
                          variant="secondary"
                          className="gap-1"
                        >
                          <Mountain className="h-3 w-3" />

                          {levelLabel(profile.hiking_level)}
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className="gap-1"
                      >
                        <Calendar className="h-3 w-3" />

                        Membre depuis{" "}
                        {new Date(
                          profile.created_at
                        ).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      {averageRating ? (
                        <>
                          {renderStars(Number(averageRating))}

                          <span className="font-medium">
                            {averageRating}/5
                          </span>

                          <span className="text-sm text-muted-foreground">
                            ({reviews.length} avis)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Aucun avis pour le moment
                        </span>
                      )}
                    </div>

                    {user?.id === profile.id && (
                      <div className="mt-4">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                        >
                          <Link to="/me">
                            Modifier mon profil
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Biographie
                  </h2>

                  {profile.bio ? (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Cet utilisateur n'a pas encore renseigné sa
                      biographie.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl">
                    Avis
                  </h2>

                  <Badge variant="secondary">
                    {reviews.length} avis
                  </Badge>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucun avis pour le moment.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                review.reviewer?.avatar_url ??
                                undefined
                              }
                            />

                            <AvatarFallback>
                              {initials(
                                review.reviewer?.full_name
                              )}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {review.reviewer?.full_name ??
                                  "Utilisateur"}
                              </p>

                              {renderStars(review.rating)}

                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            <div className="mt-1">
                              <Badge variant="outline">
                                {review.role ===
                                "participant_to_organizer"
                                  ? "Avis participant"
                                  : "Avis organisateur"}
                              </Badge>
                            </div>

                            {review.comment && (
                              <p className="mt-3 text-sm leading-relaxed">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />

      <MobileNav />
    </div>
  );
}
