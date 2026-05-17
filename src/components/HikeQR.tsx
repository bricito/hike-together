import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRDisplay } from "@/components/QRDisplay";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Props = { hikeId: string };

export function HikeQR({ hikeId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const newToken = crypto.randomUUID();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 60);

      const { error } = await supabase.from("hike_checkins").insert({
        hike_id: hikeId,
        token: newToken,
        expires_at: expires.toISOString(),
      });

      if (error) throw error;
      setToken(newToken);
      setExpiresAt(expires);
      toast.success("QR généré — valable 60 minutes.");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={loading} className="rounded-2xl gap-2 w-full">
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <RefreshCw className="h-4 w-4" />}
        {token ? "Regénérer le QR" : "Générer le QR de check-in"}
      </Button>

      {token && expiresAt && (
        <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center gap-3">
          <QRDisplay hikeId={hikeId} token={token} />
          <p className="text-xs text-muted-foreground">
            Valable jusqu'à {expiresAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}
