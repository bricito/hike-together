import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function ManageHike() {
  const { id } = useParams({ from: "/hikes/$id/manage" });

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const generateQR = async () => {
    setLoading(true);

    const newToken = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60); // QR valable 1h

    const checkinUrl =
      `${window.location.origin}/checkin?hikeId=${id}&token=${newToken}`;

    // 💾 store token in Supabase
    const { error } = await supabase.from("hike_checkins").insert({
      hike_id: id,
      token: newToken,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // 📱 QR code (simple, sans lib)
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      checkinUrl
    )}`;

    setQrUrl(qr);
    setToken(newToken);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🧑‍💼 Organisateur</h1>
      <p>Hike ID: {id}</p>

      <button onClick={generateQR} disabled={loading}>
        {loading ? "Génération..." : "Générer QR check-in"}
      </button>

      {qrUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>📱 QR Code Check-in</h3>

          <img src={qrUrl} width={250} />

          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Token: {token}
          </p>

          <p>Valable 60 minutes</p>
        </div>
      )}
    </div>
  );
}
