import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

type Props = { hikeId: string };

export function QRScanner({ hikeId }: Props) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const { data: checkin, error } = await supabase
        .from("hike_checkins")
        .select("*")
        .eq("hike_id", hikeId)
        .eq("token", token.trim())
        .single();

      if (error || !checkin) { toast.error("QR invalide."); return; }
      if (new Date(checkin.expires_at) < new Date()) { toast.error("QR expiré."); return; }
      if (checkin.used_by) { toast.error("QR déjà utilisé."); return; }

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { toast.error("Connexion requise."); return; }

      await supabase.from("hike_checkins").update({
        used_by: u.user.id,
        used_at: new Date().toISOString(),
      }).eq("id", checkin.id);

      await supabase.from("hike_participants").update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      }).eq("hike_id", hikeId).eq("user_id", u.user.id);

      toast.success("Check-in effectué ✅");
      setToken("");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors du check-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Entrez le token du QR code pour valider votre présence.</p>
      <Input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Token du QR code"
        className="rounded-2xl"
      />
      <Button onClick={handleCheckin} disabled={loading || !token.trim()} className="rounded-2xl gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Valider le check-in
      </Button>
    </div>
  );
}
