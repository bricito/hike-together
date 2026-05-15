import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function CheckinPage() {
  const { hikeId, token } = useSearch({
    from: "/checkin",
  });

  const [status, setStatus] = useState("loading");

  const checkIn = async () => {
    const { data } = await supabase
      .from("hike_checkins")
      .select("*")
      .eq("hike_id", hikeId)
      .eq("token", token)
      .single();

    if (!data) {
      setStatus("invalid ❌");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setStatus("expired ⏰");
      return;
    }

    if (data.used) {
      setStatus("already used ⚠️");
      return;
    }

    await supabase
      .from("hike_checkins")
      .update({ used: true })
      .eq("id", data.id);

    setStatus("checked-in ✅");
  };

  useEffect(() => {
    if (hikeId && token) checkIn();
  }, [hikeId, token]);

  return (
    <div style={{ padding: 20 }}>
      <h1>📱 Check-in randonnée</h1>
      <p>Statut : {status}</p>
    </div>
  );
}
