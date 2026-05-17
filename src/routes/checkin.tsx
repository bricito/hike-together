import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkin")({
  component: CheckinPage,
});

function CheckinPage() {
  const { hikeId, token } = useSearch({ from: "/checkin" }) as { hikeId?: string; token?: string };
  const [status, setStatus] = useState<"loading" | "success" | "invalid" | "expired" | "used" | "missing">("loading");

  useEffect(() => {
    const checkIn = async () => {
      if (!hikeId || !token) { setStatus("missing"); return; }

      const { data: checkin } = await supabase
        .from("hike_checkins")
        .select("*")
        .eq("hike_id", hikeId)
        .eq("token", token)
        .single();

      if (!checkin) { setStatus("invalid"); return; }
      if (new Date(checkin.expires_at) < new Date()) { setStatus("expired"); return; }
      if (checkin.used_by) { setStatus("used"); return; }

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setStatus("invalid"); return; }

      await supabase.from("hike_checkins").update({
        used_by: u.user.id,
        used_at: new Date().toISOString(),
      }).eq("id", checkin.id);

      await supabase.from("hike_participants").update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      }).eq("hike_id", hikeId).eq("user_id", u.user.id);

      setStatus("success");
    };

    checkIn();
  }, [hikeId, token]);

  const states = {
    loading: { icon: <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />, title: "Vérification en cours…", text: "" },
    success: { icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />, title: "Check-in validé ✅", text: "Votre présence a été enregistrée. Bonne randonnée !" },
    invalid: { icon: <XCircle className="h-12 w-12 text-destructive" />, title: "QR invalide", text: "Ce QR code ne correspond à aucune randonnée." },
    expired: { icon: <Clock className="h-12 w-12 text-amber-500" />, title: "QR expiré", text: "Ce QR code n'est plus valide. Demandez à l'organisateur d'en générer un nouveau." },
    used: { icon: <CheckCircle2 className="h-12 w-12 text-muted-foreground" />, title: "Déjà utilisé", text: "Vous avez déjà effectué votre check-in pour cette randonnée." },
    missing: { icon: <XCircle className="h-12 w-12 text-destructive" />, title: "Lien invalide", text: "Paramètres manquants dans le lien." },
  };

  const s = states[status];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-border bg-card p-10 max-w-sm w-full text-center space-y-4">
          <div className="flex justify-center">{s.icon}</div>
          <h1 className="font-display text-2xl">{s.title}</h1>
          {s.text && <p className="text-sm text-muted-foreground">{s.text}</p>}
        </div>
      </main>
    </div>
  );
}
