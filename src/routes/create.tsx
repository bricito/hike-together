import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { createHike } from "@/lib/hikes-api";
import type { Difficulty } from "@/lib/hikes-data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Créer une randonnée — BlablaHike" }] }),
  component: Create,
});

function Create() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    location: "",
    date: "",
    time: "",
    duration_hours: 4,
    elevation_m: 400,
    difficulty: "Moderate" as Difficulty,
    max_participants: 8,
    meeting_point: "",
    description: "",
    equipment: "",
    cover_image: "",
    price: "",
    currency: "EUR",
    reference_link: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="container mx-auto px-4 py-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Connectez-vous pour organiser une randonnée</h1>
          <p className="text-muted-foreground mt-2">Créez un compte pour partager vos aventures avec la communauté.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button asChild className="rounded-2xl"><Link to="/signup">S'inscrire</Link></Button>
            <Button asChild variant="outline" className="rounded-2xl"><Link to="/login">Se connecter</Link></Button>
          </div>
        </main>
        <SiteFooter />
        <MobileNav />
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      toast.error("Veuillez choisir une date et une heure.");
      return;
    }
    setSubmitting(true);
    try {
      const starts_at = new Date(`${form.date}T${form.time}`).toISOString();
      const res = await createHike({
        title: form.title,
        location: form.location,
        starts_at,
        duration_hours: Number(form.duration_hours),
        elevation_m: Number(form.elevation_m),
        difficulty: form.difficulty,
        max_participants: Number(form.max_participants),
        meeting_point: form.meeting_point,
        description: form.description,
        equipment: form.equipment.split(",").map((s) => s.trim()).filter(Boolean),
        cover_image: form.cover_image || null,
        price_cents: form.price ? Math.round(Number(form.price) * 100) : null,
        currency: form.currency || "EUR",
      });
      toast.success("Randonnée publiée !");
      navigate({ to: "/hikes/$slug", params: { slug: res.slug } });
    } catch (err: any) {
      toast.error(err.message ?? "Impossible de créer la randonnée.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl">Créer une randonnée</h1>
        <p className="text-muted-foreground mt-2">Partagez votre prochaine aventure avec la communauté.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Titre de la randonnée"><Input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Boucle du lever de soleil au Lac Vert" className="h-12 rounded-2xl" /></Field>
          <Field label="Lieu"><Input required value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Chamonix, France" className="h-12 rounded-2xl" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-12 rounded-2xl" /></Field>
            <Field label="Heure"><Input required type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className="h-12 rounded-2xl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée (h)"><Input type="number" min={1} value={form.duration_hours} onChange={(e) => set("duration_hours", Number(e.target.value))} className="h-12 rounded-2xl" /></Field>
            <Field label="Dénivelé (m)"><Input type="number" min={0} value={form.elevation_m} onChange={(e) => set("elevation_m", Number(e.target.value))} className="h-12 rounded-2xl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Difficulté">
              <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)} className="w-full h-12 rounded-2xl border border-input bg-background px-3 text-sm">
                <option value="Easy">Facile</option>
                <option value="Moderate">Modéré</option>
                <option value="Hard">Difficile</option>
                <option value="Expert">Expert</option>
              </select>
            </Field>
            <Field label="Nombre de participants max"><Input type="number" min={2} value={form.max_participants} onChange={(e) => set("max_participants", Number(e.target.value))} className="h-12 rounded-2xl" /></Field>
          </div>
          <Field label="Point de rendez-vous"><Input value={form.meeting_point} onChange={(e) => set("meeting_point", e.target.value)} placeholder="Parking des Praz" className="h-12 rounded-2xl" /></Field>
          <Field label="URL de l'image de couverture (optionnel)"><Input value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)} placeholder="https://..." className="h-12 rounded-2xl" /></Field>
          <Field label="Lien de référence">
            <Input value={form.reference_link} onChange={(e) => set("reference_link", e.target.value)} placeholder="https://www.alltrails.com/trail/..." className="h-12 rounded-2xl" />
            <p className="text-xs text-muted-foreground mt-1.5">
              📎 Collez ici le lien de votre itinéraire depuis <span className="font-medium text-foreground">AllTrails</span>, <span className="font-medium text-foreground">Visorando</span>, <span className="font-medium text-foreground">Komoot</span> ou toute autre plateforme — les participants pourront consulter le tracé et les détails complets.
            </p>
          </Field>
          <Field label="Description">
            <textarea required value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Décrivez ce que les participants peuvent attendre..." className="w-full rounded-2xl border border-input bg-background p-3 text-sm" />
          </Field>
          <Field label="Équipement nécessaire (séparé par des virgules)"><Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Chaussures de rando, eau, lampe frontale" className="h-12 rounded-2xl" /></Field>
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Field label="Prix par personne (optionnel)">
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="ex. 12.50 pour le transport" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Devise">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="w-full h-12 rounded-2xl border border-input bg-background px-3 text-sm">
                <option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option>
              </select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">Laissez vide si la randonnée est gratuite. Utilisez ce champ pour partager les frais de transport.</p>

          <Button disabled={submitting} className="w-full h-12 rounded-2xl mt-4">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier la randonnée"}
          </Button>
        </form>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
