import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  LogIn,
} from "lucide-react";

export const Route = createFileRoute("/checkin")({
  component: CheckinPage,
});

type Status =
  | "loading"
  | "success"
  | "invalid"
  | "expired"
  | "already_checked"
  | "login_required"
  | "missing"
  | "error";

function CheckinPage() {
  const { token } = useSearch({
    from: "/checkin",
  }) as {
    token?: string;
  };

  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const validateCheckin = async () => {
      try {
        // -----------------------------------
        // Vérification token
        // -----------------------------------

        if (!token) {
          setStatus("missing");
          return;
        }

        // -----------------------------------
        // Vérification utilisateur connecté
        // -----------------------------------

        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
          setStatus("login_required");

          // Redirection auto vers auth
          setTimeout(() => {
            window.location.href = `/auth?redirect=${encodeURIComponent(
              `/checkin?token=${token}`
            )}`;
          }, 1500);

          return;
        }

        const user = authData.user;

        // -----------------------------------
        // Vérification QR
        // -----------------------------------

        const { data: checkin, error: checkinError } = await supabase
          .from("hike_checkins")
          .select("*")
          .eq("token", token)
          .single();

        if (checkinError || !checkin) {
          setStatus("invalid");
          return;
        }

        // -----------------------------------
        // Vérification expiration
        // -----------------------------------

        if (new Date(checkin.expires_at) < new Date()) {
          setStatus("expired");
          return;
        }

        // -----------------------------------
        // Vérification participation
        // -----------------------------------

        const { data: participant, error: participantError } = await supabase
          .from("hike_participants")
          .select("*")
          .eq("hike_id", checkin.hike_id)
          .eq("user_id", user.id)
          .single();

        if (participantError || !participant) {
          setStatus("invalid");
          return;
        }

        // -----------------------------------
        // Déjà check-in ?
        // -----------------------------------

        if (participant.checked_in) {
          setStatus("already_checked");
          return;
        }

        // -----------------------------------
        // Validation présence
        // -----------------------------------

        const { error: updateError } = await supabase
          .from("hike_participants")
          .update({
            checked_in: true,
            checked_in_at: new Date().toISOString(),
          })
          .eq("hike_id", checkin.hike_id)
          .eq("user_id", user.id);

        if (updateError) {
          setStatus("error");
          return;
        }

        // -----------------------------------
        // Récupération randonnée
        // -----------------------------------

        const { data: hike } = await supabase
          .from("hikes")
          .select("organizer_id,title")
          .eq("id", checkin.hike_id)
          .single();

        // -----------------------------------
        // Récupération profil participant
        // -----------------------------------

        const { data: profile } = await supabase
          .from("profiles")
          .select("pseudo")
          .eq("id", user.id)
          .single();

        // -----------------------------------
        // Notification organisateur
        // -----------------------------------

        if (hike?.organizer_id) {
          const pseudo = profile?.pseudo || "Un participant";
          const hikeTitle = hike?.title || "une randonnée";
          
          await supabase.from("notifications").insert({
            user_id: hike.organizer_id,
            type: "hike_checkin",
            payload: {
              hike_id: checkin.hike_id,
              participant_id: user.id,
              participant_pseudo:
                profile?.pseudo || "Un participant",
            },
          });
        }

        setStatus("success");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    validateCheckin();
  }, [token]);

  const states = {
    loading: {
      icon: (
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      ),
      title: "Validation en cours...",
      text: "Veuillez patienter quelques secondes.",
    },

    success: {
      icon: (
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      ),
      title: "Participation confirmée ✅",
      text: "Votre présence a bien été enregistrée. Bonne randonnée !",
    },

    invalid: {
      icon: (
        <XCircle className="h-12 w-12 text-destructive" />
      ),
      title: "QR invalide",
      text: "Ce QR code ne correspond à aucun check-in valide.",
    },

    expired: {
      icon: (
        <Clock className="h-12 w-12 text-amber-500" />
      ),
      title: "QR expiré",
      text: "Ce QR code n'est plus valide.",
    },

    already_checked: {
      icon: (
        <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
      ),
      title: "Déjà validé",
      text: "Votre présence a déjà été enregistrée.",
    },

    login_required: {
      icon: (
        <LogIn className="h-12 w-12 text-primary" />
      ),
      title: "Connexion requise",
      text: "Redirection vers la connexion...",
    },

    missing: {
      icon: (
        <XCircle className="h-12 w-12 text-destructive" />
      ),
      title: "Lien invalide",
      text: "Le token du QR code est manquant.",
    },

    error: {
      icon: (
        <XCircle className="h-12 w-12 text-destructive" />
      ),
      title: "Erreur",
      text: "Une erreur est survenue lors du check-in.",
    },
  };

  const current = states[status];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-sm space-y-5">
          <div className="flex justify-center">
            {current.icon}
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl">
              {current.title}
            </h1>

            <p className="text-sm text-muted-foreground">
              {current.text}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
