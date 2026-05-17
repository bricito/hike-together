import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { HikeParticipants } from "@/components/HikeParticipants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TrendingUp, Users, MapPin, Calendar, Backpack, Loader2, Check, X, UserPlus, MessageCircle, AlertTriangle, Pencil, QrCode } from "lucide-react";
import { fetchHikeBySlug, fetchPublicHikes, fetchMyParticipation, requestToJoinHike, cancelJoinRequest, updateHike } from "@/lib/hikes-api";
import type { HikeView } from "@/lib/hikes-api";
import type { Difficulty } from "@/lib/hikes-data";
import { fetchHikeRequests, respondToRequest, saveLiabilityAcceptance } from "@/lib/messages-api";
import { useAuth } from "@/lib/auth-context";

const LIABILITY_TEXT = `En participant à une randonnée organisée via BlablaHike, vous reconnaissez et acceptez ce qui suit :

1. Conscience des risques
La randonnée est une activité de plein air exposant les participants à des risques naturels : conditions météorologiques changeantes, terrain irrégulier ou accidenté, fatigue physique, etc. Vous participez en pleine connaissance de ces risques.

2. Aptitude personnelle
Vous déclarez être en condition physique adaptée à la sortie choisie et disposer du matériel approprié (chaussures de randonnée, eau, vêtements adaptés à la saison, etc.).

3. Rôle de l'organisateur
L'organisateur agit en tant que particulier ou facilitateur bénévole. Il n'est ni un professionnel de l'encadrement sportif ni un guide breveté, sauf mention explicite dans la description de la sortie.

4. Responsabilité personnelle
Vous renoncez, dans les limites autorisées par la loi applicable, à tout recours contre l'organisateur en cas d'accident, de blessure ou de dommage survenu lors de la randonnée, sauf en cas de faute lourde ou intentionnelle de sa part.

5. Comportement sécuritaire
Vous vous engagez à adopter un comportement prudent, à respecter les consignes de l'organisateur et à ne pas mettre en danger les autres participants.

En cochant la case ci-dessous, vous confirmez avoir lu, compris et accepté l'ensemble de ces conditions. Cette acceptation est horodatée et conservée.`;

export const Route = createFileRoute("/hikes/$slug")({
  loader: async ({ params }) => {
    const hike = await fetchHikeBySlug(params.slug);
    if (!hike) throw notFound();
    return { hike };
  },
  head: ({ loaderData }) => {
    const h = loaderData?.hike;
    if (!h) return { meta: [{ title: "Randonnée — BlablaHike" }] };
    return {
      meta: [
        { title: `${h.title} — BlablaHike` },
        { name: "description", content: `${h.title} à ${h.location}. Randonnée ${h.difficulty}, ${h.durationHours}h, ${h.elevationM}m de dénivelé.` },
        { property: "og:title", content: h.title },
        { property: "og:description", content: `${h.location} · ${h.date}` },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="font-display text-3xl">Randonnée introuvable</h1>
        <Link to="/hikes" className="text-primary hover:underline mt-3 inline-block">Voir toutes les randonnées</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center"><p>{error.message}</p></div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  ),
  component: HikeDetail,
});

function LiabilityModal({ onConfirm, onCancel, isPending }: { onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  const [checked, setChecked] = useState(false);
  const [showText, setShowText] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-[var(--shadow-elegant)] max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl">Conditions de participation</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Avant de rejoindre cette randonnée, veuillez lire et accepter les conditions ci-dessous.
        </p>
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          className="text-sm text-primary hover:underline mb-3 block"
        >
          {showText ? "Masquer les conditions ▲" : "Lire les conditions complètes ▼"}
        </button>
        {showText && (
          <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-line mb-4 max-h-48 overflow-y-auto">
            {LIABILITY_TEXT}
          </div>
        )}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-border hover:bg-secondary/40 transition-colors">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">
            Je reconnais les risques inhérents à la randonnée et accepte les conditions de participation
          </span>
        </label>
        <p className="text-[11px] text-muted-foreground mt-2 mb-6">
          En cochant cette case, votre acceptation sera horodatée et conservée. Consultez notre{" "}
          <Link to="/safety" className="text-primary hover:underline">page Sécurité</Link>.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onCancel} disabled={isPending}>
            Annuler
          </Button>
          <Button className="flex-1 rounded-2xl" disabled={!checked || isPending} onClick={onConfirm}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer ma demande"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditHikeModal({ hike, onClose, onSaved }: { hike: HikeView; onClose: () => void; onSaved: () => void }) {
  const startsAt = new Date(hike.starts_at);
  const dateStr = startsAt.toISOString().split("T")[0];
  const timeStr = startsAt.toISOString().split("T")[1].slice(0, 5);

  const [form, setForm] = useState({
    title: hike.title,
    location: hike.location,
    date: dateStr,
    time: timeStr,
    duration_hours: hike.durationHours,
    elevation_m: hike.elevationM,
    difficulty: hike.difficulty as Difficulty,
    max_participants: hike.maxParticipants,
    meeting_point: hike.meetingPoint,
    description: hike.description,
    equipment: hike.equipment.join(", "),
    price: hike.priceCents ? (hike.priceCents / 100).toString() : "",
    currency: hike.currency,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const qc = useQueryClient();
  const saveMut = useMutation({
    mutationFn: () => updateHike(hike.id, {
      title: form.title,
      location: form.location,
      starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
      duration_hours: Number(form.duration_hours),
      elevation_m: Number(form.elevation_m),
      difficulty: form.difficulty,
      max_participants: Number(form.max_participants),
      meeting_point: form.meeting_point,
      description: form.description,
      equipment: form.equipment.split(",").map((s) => s.trim()).filter(Boolean),
      cover_image: null,
      price_cents: form.price ? Math.round(Number(form.price) * 100) : null,
      currency: form.currency,
    }),
    onSuccess: () => {
      toast.success("Randonnée mise à jour !");
      qc.invalidateQueries({ queryKey: ["hikes"] });
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Impossible de mettre à jour."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-[var(--shadow-elegant)] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Modifier la randonnée</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-4">
          <Field label="Titre"><Input required value={form.title} onChange={(e) => set("title", e.target.value)} className="h-12 rounded-2xl" /></Field>
          <Field label="Lieu"><Input required value={form.location} onChange={(e) => set("location", e.target.value)} className="h-12 rounded-2xl" /></Field>
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
            <Field label="Participants max"><Input type="number" min={2} value={form.max_participants} onChange={(e) => set("max_participants", Number(e.target.value))} className="h-12 rounded-2xl" /></Field>
          </div>
          <Field label="Point de rendez-vous"><Input value={form.meeting_point} onChange={(e) => set("meeting_point", e.target.value)} className="h-12 rounded-2xl" /></Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="w-full rounded-2xl border border-input bg-background p-3 text-sm" />
          </Field>
          <Field label="Équipement (séparé par des virgules)"><Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} className="h-12 rounded-2xl" /></Field>
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Field label="Prix par personne (optionnel)">
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="ex. 12.50" className="h-12 rounded-2xl" />
            </Field>
            <Field label="Devise">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="w-full h-12 rounded-2xl border border-input bg-background px-3 text-sm">
                <option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-2xl" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </div>
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

function HikeDetail() {
  const { hike } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showLiability, setShowLiability] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const participationKey = ["participation", hike.id, user?.id];
  const { data: participation } = useQuery({
    queryKey: participationKey,
    queryFn: () => fetchMyParticipation(hike.id, user!.id),
    enabled: !!user,
  });

  const joinMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      if (u.user) await saveLiabilityAcceptance(u.user.id, hike.id);
      return requestToJoinHike(hike.id);
    },
    onSuccess: (data) => {
      qc.setQueryData(participationKey, data);
      setShowLiability(false);
      toast.success("Demande envoyée ! L'organisateur va l'examiner.");
    },
    onError: (e: any) => {
      setShowLiability(false);
      toast.error(e.message ?? "Impossible d'envoyer la demande.");
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelJoinRequest(participation!.id),
    onSuccess: () => {
      qc.setQueryData(participationKey, null);
      toast.success("Demande annulée.");
    },
    onError: (e: any) => toast.error(e.message ?? "Impossible d'annuler la demande."),
  });

  const isOrganizer = user?.id === hike.organizer.id;

  const requestsKey = ["hike-requests", hike.id];
  const { data: requests = [] } = useQuery({
    queryKey: requestsKey,
    queryFn: () => fetchHikeRequests(hike.id),
    enabled: isOrganizer,
  });

  const respondMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) =>
      respondToRequest(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: requestsKey });
      qc.invalidateQueries({ queryKey: ["hikes"] });
      qc.invalidateQueries({ queryKey: ["hike-participants", hike.id] });
      toast.success(vars.status === "accepted" ? "Demande acceptée." : "Demande refusée.");
    },
    onError: (e: any) => toast.error(e.message ?? "Impossible de mettre à jour la demande."),
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const { data: others = [] } = useQuery({
    queryKey: ["hikes", "others", hike.id],
    queryFn: () => fetchPublicHikes({ limit: 4 }),
    select: (rows) => rows.filter((h) => h.id !== hike.id).slice(0, 3),
  });

  return (
    <div className="min-h-screen flex flex-col">
      {showLiability && (
        <LiabilityModal
          onConfirm={() => joinMut.mutate()}
          onCancel={() => setShowLiability(false)}
          isPending={joinMut.isPending}
        />
      )}
      {showEdit && (
        <EditHikeModal
          hike={hike}
          onClose={() => setShowEdit(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      <SiteHeader />

      <div className="container mx-auto px-4 pt-6 flex items-center justify-between">
        <Link to="/hikes" className="text-sm text-muted-foreground hover:text-foreground">← Retour aux randonnées</Link>
        {isOrganizer && (
          <Button variant="outline" size="sm" className="rounded-2xl gap-1.5" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
        )}
      </div>

      <section className="container mx-auto px-4 mt-6 grid lg:grid-cols-[1fr_380px] gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{hike.difficulty}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{hike.location}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">{hike.title}</h1>

          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            <Stat icon={Calendar} label="Date" value={hike.date} />
            <Stat icon={Clock} label="Durée" value={`${hike.durationHours}h`} />
            <Stat icon={TrendingUp} label="Dénivelé" value={`${hike.elevationM}m`} />
            <Stat icon={Users} label="Groupe" value={`${hike.maxParticipants - hike.spotsLeft}/${hike.maxParticipants}`} />
          </div>

          <div className="mt-10 flex items-center gap-4 p-5 rounded-3xl bg-card shadow-[var(--shadow-soft)]">
            <Link to="/profile/$id" params={{ id: hike.organizer.id }}>
              <img src={hike.organizer.avatar} alt={hike.organizer.name} className="h-14 w-14 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all" />
            </Link>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Organisé par</p>
              <Link to="/profile/$id" params={{ id: hike.organizer.id }} className="font-medium hover:text-primary transition-colors">
                {hike.organizer.name}
              </Link>
              <p className="text-xs text-muted-foreground">Randonneur {hike.organizer.level}</p>
            </div>
            {user && !isOrganizer && (
              <Button asChild variant="outline" size="sm" className="rounded-2xl gap-1.5">
                <Link to="/messages/$hikeId" params={{ hikeId: hike.id }}>
                  <MessageCircle className="h-4 w-4" /> Contacter
                </Link>
              </Button>
            )}
            {!user && (
              <Button variant="outline" size="sm" className="rounded-2xl gap-1.5"
                onClick={() => navigate({ to: "/login", search: { redirect: `/hikes/${hike.slug}` } as any })}>
                <MessageCircle className="h-4 w-4" /> Contacter
              </Button>
            )}
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">À propos de cette randonnée</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{hike.description}</p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">Point de rendez-vous</h2>
            <div className="flex items-start gap-3 p-5 rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)]">
              <span className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">{hike.meetingPoint || "Non renseigné"}</p>
                <p className="text-xs text-muted-foreground mt-1">Soyez à l'heure ! Contactez l'organisateur en cas de problème.</p>
              </div>
            </div>
          </div>

          {hike.equipment.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl mb-3">Ce qu'il faut apporter</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {hike.equipment.map((e: string) => (
                  <li key={e} className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 text-sm">
                    <Backpack className="h-4 w-4 text-primary" /> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">Participants</h2>
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)]">
              <HikeParticipants hikeId={hike.id} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">

          {/* Carte principale */}
          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-elegant)] border border-border">
            <p className="text-sm text-muted-foreground">Rejoindre cette randonnée</p>
            <p className="font-display text-2xl mt-1">{hike.spotsLeft} places restantes</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hike.priceCents != null && hike.priceCents > 0
                ? `${(hike.priceCents / 100).toFixed(2)} ${hike.currency} par personne · Organisé par la communauté`
                : "Gratuit · Organisé par la communauté"}
            </p>

            {isOrganizer ? (
              <div className="mt-5 space-y-2">
                <div className="p-3 rounded-2xl bg-secondary/50 text-sm text-center text-muted-foreground">
                  Vous organisez cette randonnée
                </div>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link to="/messages/$hikeId" params={{ hikeId: hike.id }}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Chat — {hike.title}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link to="/hikes/$id/manage" params={{ id: hike.id }}>
                    <QrCode className="h-4 w-4 mr-1" /> Gérer le check-in
                  </Link>
                </Button>
              </div>
            ) : !user ? (
              <>
                <Button size="lg" className="w-full rounded-2xl mt-5"
                  onClick={() => navigate({ to: "/login", search: { redirect: `/hikes/${hike.slug}` } as any })}>
                  Connectez-vous pour rejoindre
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-3">Un compte est nécessaire pour rejoindre</p>
              </>
            ) : participation?.status === "pending" ? (
              <>
                <div className="mt-5 p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Demande en attente
                </div>
                <Button variant="outline" className="w-full rounded-2xl mt-2" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}>
                  <X className="h-4 w-4" /> Annuler la demande
                </Button>
              </>
            ) : participation?.status === "accepted" ? (
              <>
                <div className="mt-5 p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> Vous participez !
                </div>
                <Button asChild variant="outline" className="w-full rounded-2xl mt-2">
                  <Link to="/messages/$hikeId" params={{ hikeId: hike.id }}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Chat — {hike.title}
                  </Link>
                </Button>
              </>
            ) : participation?.status === "declined" ? (
              <div className="mt-5 p-3 rounded-2xl bg-secondary/60 text-sm text-center text-muted-foreground">
                Votre demande n'a pas été retenue cette fois.
              </div>
            ) : (
              <Button size="lg" className="w-full rounded-2xl mt-5" disabled={hike.spotsLeft === 0} onClick={() => setShowLiability(true)}>
                {hike.spotsLeft === 0 ? "Randonnée complète" : "Demander à rejoindre"}
              </Button>
            )}
          </div>

          {/* Demandes en attente — organisateur seulement */}
          {isOrganizer && (
            <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)] border border-border">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-4 w-4 text-primary" />
                <p className="font-medium text-sm">Demandes de participation</p>
                {pendingRequests.length > 0 && (
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {pendingRequests.length} en attente
                  </span>
                )}
              </div>
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune demande en attente.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingRequests.map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <Link to="/profile/$id" params={{ id: r.user_id }}>
                        <img src={r.user?.avatar_url || "https://i.pravatar.cc/40"} alt="" className="h-9 w-9 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/profile/$id" params={{ id: r.user_id }} className="text-sm font-medium truncate hover:text-primary transition-colors block">
                          {r.user?.full_name || "Randonneur"}
                        </Link>
                        <p className="text-[11px] text-muted-foreground truncate">{r.user?.hiking_level || "Randonneur"}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-500/10"
                        disabled={respondMut.isPending} onClick={() => respondMut.mutate({ id: r.id, status: "accepted" })} aria-label="Accepter">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-600 hover:bg-red-500/10"
                        disabled={respondMut.isPending} onClick={() => respondMut.mutate({ id: r.id, status: "declined" })} aria-label="Refuser">
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </section>

      {others.length > 0 && (
        <section className="container mx-auto px-4 mt-20">
          <h2 className="font-display text-2xl mb-6">D'autres randonnées qui pourraient vous plaire</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((h) => (
              <Link
                key={h.id}
                to="/hikes/$slug"
                params={{ slug: h.slug }}
                className="group rounded-3xl bg-card border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all p-5"
              >
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3 w-3" />{h.location}
                </p>
                <p className="font-medium group-hover:text-primary transition-colors">{h.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{h.date}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.durationHours}h</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{h.elevationM}m</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{h.spotsLeft} places</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
