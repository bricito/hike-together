import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zyxeupstiihvrzelbgwi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eGV1cHN0aWlodnJ6ZWxiZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjAzNzIsImV4cCI6MjA5MzczNjM3Mn0.MHgbyK3oO6z15eCfqX0Blhgm8DGi4TN60EaW8NCl-CY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

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
