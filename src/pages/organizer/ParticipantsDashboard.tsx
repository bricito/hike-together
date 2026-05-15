import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Participant = {
  user_id: string;
  status: string;
  profiles?: { name?: string };
};

type Checkin = {
  user_id: string;
  used: boolean;
};

export default function ParticipantsDashboard() {
  const { id } = useParams({ from: "/hikes/$id/manage" });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  // 🔄 fetch participants
  const fetchParticipants = async () => {
    const { data } = await supabase
      .from("hike_participants")
      .select("user_id,status,profiles(name)")
      .eq("hike_id", id);

    setParticipants((data as any) || []);
  };

  // 🔄 fetch check-ins
  const fetchCheckins = async () => {
    const { data } = await supabase
      .from("hike_checkins")
      .select("user_id,used")
      .eq("hike_id", id);

    setCheckins((data as any) || []);
  };

  useEffect(() => {
    fetchParticipants();
    fetchCheckins();

    // ⚡ REALTIME (live update)
    const channel = supabase
      .channel("checkins-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hike_checkins",
          filter: `hike_id=eq.${id}`,
        },
        () => {
          fetchCheckins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const isCheckedIn = (user_id: string) => {
    return checkins.some((c) => c.user_id === user_id && c.used);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>👥 Participants dashboard</h1>

      <p>Total: {participants.length}</p>

      <div style={{ marginTop: 20 }}>
        {participants.map((p) => (
          <div
            key={p.user_id}
            style={{
              padding: 10,
              marginBottom: 8,
              border: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong>{p.profiles?.name || p.user_id}</strong>
              <div style={{ fontSize: 12 }}>{p.status}</div>
            </div>

            <div>
              {isCheckedIn(p.user_id) ? (
                <span style={{ color: "green" }}>✅ Présent</span>
              ) : (
                <span style={{ color: "orange" }}>⏳ Pas check-in</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
