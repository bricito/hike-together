import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/me")({
  component: MyProfilePage,
});

function MyProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, city, country, hiking_level")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [hikingLevel, setHikingLevel] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
      setHikingLevel(profile.hiking_level ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = fullName.trim();
      if (!trimmed) throw new Error("Le pseudo ne peut pas être vide");
      if (trimmed.length > 60) throw new Error("Pseudo trop long (max 60)");
      if (bio.length > 1000) throw new Error("Biographie trop longue (max 1000)");
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user!.id,
          full_name: trimmed,
          bio: bio.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          hiking_level: hikingLevel.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl">Mon espace</h1>
          {user && (
            <Button asChild variant="outline" size="sm">
              <Link to="/profile/$id" params={{ id: user.id }}>Voir mon profil public</Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations publiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Pseudo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} placeholder="Votre pseudo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={5} placeholder="Parlez de vous, vos randos préférées…" />
                  <p className="text-xs text-muted-foreground">{bio.length}/1000</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Niveau de randonnée</Label>
                  <Input id="level" value={hikingLevel} onChange={(e) => setHikingLevel(e.target.value)} maxLength={40} placeholder="Débutant, Intermédiaire, Avancé…" />
                </div>
                <div className="pt-2">
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    {save.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </div>
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
