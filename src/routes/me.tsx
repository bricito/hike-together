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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

export const Route = createFileRoute("/me")({
  component: MyProfilePage,
});

const HIKING_LEVELS = ["Débutant", "Intermédiaire", "Expert"];

// 24 avatars prédéfinis via DiceBear (gratuit, pas de stockage)
const AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Milo&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=d1f4cc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Oscar&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Max&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Lily&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&backgroundColor=d1f4cc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Emma&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Noah&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aria&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Liam&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Chloe&backgroundColor=d1f4cc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Ethan&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Sophie&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Jack&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Isla&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver&backgroundColor=d1f4cc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Mia&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Hugo&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Jade&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Tom&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Nina&backgroundColor=d1f4cc",
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 mt-3">
      {AVATARS.map((url) => (
        <button
          key={url}
          type="button"
          onClick={() => onSelect(url)}
          className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
            selected === url
              ? "border-primary scale-105 shadow-md"
              : "border-transparent hover:border-primary/40"
          }`}
        >
          <img src={url} alt="avatar" className="w-full aspect-square" />
          {selected === url && (
            <span className="absolute inset-0 bg-primary/20 grid place-items-center">
              <Check className="h-4 w-4 text-primary" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function MyProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

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
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
      setHikingLevel(profile.hiking_level ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
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
          hiking_level: hikingLevel || null,
          avatar_url: avatarUrl || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
      setShowAvatarPicker(false);
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
                {/* Avatar */}
                <div className="space-y-2">
                  <Label>Photo de profil</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                      <AvatarFallback>{initials(fullName)}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                      onClick={() => setShowAvatarPicker((v) => !v)}
                    >
                      {showAvatarPicker ? "Fermer ▲" : "Choisir un avatar ▼"}
                    </Button>
                  </div>
                  {showAvatarPicker && (
                    <div className="rounded-2xl border border-border p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-2">Cliquez sur un avatar pour le sélectionner</p>
                      <AvatarPicker
                        selected={avatarUrl}
                        onSelect={(url) => {
                          setAvatarUrl(url);
                          setShowAvatarPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Pseudo */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Pseudo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} placeholder="Votre pseudo" />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={5} placeholder="Parlez de vous, vos randos préférées…" />
                  <p className="text-xs text-muted-foreground">{bio.length}/1000</p>
                </div>

                {/* Ville / Pays */}
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

                {/* Niveau */}
                <div className="space-y-2">
                  <Label htmlFor="level">Niveau de randonnée</Label>
                  <select
                    id="level"
                    value={hikingLevel}
                    onChange={(e) => setHikingLevel(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— Sélectionnez votre niveau —</option>
                    {HIKING_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
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
