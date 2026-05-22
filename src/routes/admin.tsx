import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    hikes: 0,
    checkins: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadAdmin();
  }, []);

  const loadAdmin = async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    if (profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    setAuthorized(true);

    // USERS
    const { count: users } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // HIKES
    const { count: hikes } = await supabase
      .from("hikes")
      .select("*", { count: "exact", head: true });

    // CHECKINS
    const { count: checkins } = await supabase
      .from("hike_participants")
      .select("*", { count: "exact", head: true })
      .eq("checked_in", true);

    // REVENUE
    const { data: payments } = await supabase
      .from("payments")
      .select("commission");

    const revenue =
      payments?.reduce(
        (sum, payment) => sum + Number(payment.commission),
        0
      ) || 0;

    setStats({
      users: users || 0,
      hikes: hikes || 0,
      checkins: checkins || 0,
      revenue,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-10">
        Chargement...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">

      <h1 className="text-4xl font-bold mb-8">
        Dashboard Admin
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card
          title="Utilisateurs"
          value={stats.users}
        />

        <Card
          title="Randonnées"
          value={stats.hikes}
        />

        <Card
          title="Check-ins"
          value={stats.checkins}
        />

        <Card
          title="Revenus"
          value={`${stats.revenue} €`}
        />

      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
