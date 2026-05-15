import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function CheckinPage() {
  const { hikeId, token } = useSearch({ from: "/checkin" });

  const [status, setStatus] = useState("loading");

  const checkIn = async () => {
    if (!hikeId || !token) {
      setStatus("invalid ❌");
      return;
    }

    // 1. check token validity
    const { data, error } = await supabase
      .from("hike_checkins")
      .select("*")
      .eq("hike_id", hikeId)
      .eq("token", token)
      .single();

    if (error || !data) {
      setStatus("invalid ❌");
      return;
    }

    // 2. check expiration
    if (new Date(data.expires_at) < new Date()) {
      setStatus("expired ⏰");
      return;
    }

    // 3. anti double scan
    if (data.used) {
      setStatus("already used ⚠️");
      return;
    }

    // 4. update check-in
    const { error: updateError } = await supabase
      .from("hike_checkins")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) {
      setStatus("error ❌");
      return;
    }

    // 5. (IMPORTANT) insert participant log
    await supabase.from("hike_participants").insert({
      hike_id: hikeId,
      checkin_id: data.id,
      checked_in_at: new Date().toISOString(),
    });

    setStatus("checked-in ✅");
  };

  useEffect(() => {
    checkIn();
  }, [hikeId, token]);

  return (
    <div style={{ padding: 20 }}>
      <h1>📱 Check-in randonnée</h1>
      <p>Statut : {status}</p>
    </div>
  );
}
