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

  const generateQR = async () => {
    setLoading(true);

    const token = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    const checkinUrl = `${window.location.origin}/checkin?hikeId=${id}&token=${token}`;

    // save in Supabase
    await supabase.from("hike_checkins").insert({
      hike_id: id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    // QR via API Google Chart (zéro package requis)
    const qr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
      checkinUrl
    )}`;

    setQrUrl(qr);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🧑‍💼 Organisateur</h1>
      <p>Hike ID: {id}</p>

      <button onClick={generateQR} disabled={loading}>
        {loading ? "Génération..." : "Afficher QR code"}
      </button>

      {qrUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>📱 QR Code Check-in</h3>
          <img src={qrUrl} width={250} />
          <p>Les participants doivent scanner ce code</p>
        </div>
      )}
    </div>
  );
}
