import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleDelete() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Session expirée, reconnecte-toi.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || data?.error) {
      toast.error("Une erreur est survenue. Réessaie ou contacte le support.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    toast.success("Compte supprimé.");
    navigate({ to: "/" });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        onClick={() => setConfirming(true)}
        className="text-destructive hover:text-destructive"
      >
        Supprimer mon compte
      </Button>
    );
  }

  return (
    <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">
        Cette action est irréversible. Toutes tes données (randonnées, contenus, profil, paiements) seront définitivement supprimées.
      </p>
      <div className="flex gap-2">
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? "Suppression…" : "Confirmer la suppression"}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
