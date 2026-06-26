import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/me")({
  component: MyProfilePage,
});

const HIKING_LEVELS = ["Débutant", "Intermédiaire", "Expert"];

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

// ─── Géocodage Nominatim ───────────────────────────────────────────────────
async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  if (!city.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BlablaHike/1.0" },
    });
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
// ──────────────────────────────────────────────────────────────────────────

function MyProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
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

  // Garde en mémoire la ville déjà géocodée pour éviter un appel inutile
  const previousCity = useRef<string>("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
      setHikingLevel(profile.hiking_level ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      previousCity.current = profile.city ?? "";
    }
  }, [profile]);

  // =========================
  // UPLOAD + COMPRESSION IMAGE
  // =========================

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image.");
      return;
    }

    setUploading(true);

    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const SIZE = 128;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossible de compresser l'image.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, SIZE, SIZE);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.6);
      });
      if (!blob) throw new Error("Compression échouée.");

      const compressedFile = new File([blob], "avatar.webp", {
        type: "image/webp",
      });

      const path = `${user.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, compressedFile, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(publicUrl);

      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: publicUrl });
      if (dbError) throw dbError;

      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Photo optimisée !");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = fullName.trim();
      if (!trimmed) throw new Error("Le pseudo ne peut pas être vide");
      if (trimmed.length > 60) throw new Error("Pseudo trop long (max 60)");
      if (bio.length > 1000) throw new Error("Biographie trop longue (max 1000)");

      // Géocoder uniquement si la ville a changé
      let latitude: number | null = null;
      let longitude: number | null = null;

      const trimmedCity = city.trim();
      if (trimmedCity && trimmedCity !== previousCity.current) {
        const coords = await geocodeCity(trimmedCity);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        } else {
          // Ville non trouvée : on prévient mais on ne bloque pas la sauvegarde
          toast.warning("Ville introuvable, les notifications de proximité seront désactivées.");
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user!.id,
        full_name: trimmed,
        bio: bio.trim() || null,
        city: trimmedCity || null,
        country: country.trim() || null,
        hiking_level: hikingLevel || null,
        avatar_url: avatarUrl || null,
        // N'écraser les coords que si la ville a changé
        ...(trimmedCity !== previousCity.current && {
          latitude,
          longitude,
        }),
      });

      if (error) throw error;

      // Mettre à jour la référence après succès
      previousCity.current = trimmedCity;
    },

    onSuccess: () => {
      toast.success("Profil mis à jour");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
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
          <h1 className="font-display text-3xl">Mon espace</h1>

          {user && (
            <Button asChild variant="outline" size="sm">
              <Link to="/profile/$id" params={{ id: user.id }}>
                Voir mon profil public
              </Link>
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
                {/* PHOTO */}
                <div className="space-y-2">
                  <Label>Photo de profil</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                        <AvatarFallback>{initials(fullName)}</AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </button>
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Upload en cours…" : "Changer la photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Toutes les images sont automatiquement compressées.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>

                {/* PSEUDO */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Pseudo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={60}
                    placeholder="Votre pseudo"
                  />
                </div>

                {/* BIO */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Parlez de vous, vos randos préférées…"
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/1000</p>
                </div>

                {/* VILLE / PAYS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      maxLength={80}
                      placeholder="ex: Chambéry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      maxLength={80}
                    />
                  </div>
                </div>

                {/* NIVEAU */}
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
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SAVE */}
                <div className="pt-2">
                  <Button
                    onClick={() => save.mutate()}
                    disabled={save.isPending || uploading}
                  >
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
