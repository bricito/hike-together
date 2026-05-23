import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/super-admin-8472")({
  component: AdminPage,
});

function AdminPage() {
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
    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        setLoading(false);
        return;
      }

      // Vérification rôle admin
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

      // =========================
      // USERS
      // =========================

      const { count: users } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        });

      // =========================
      // HIKES
      // =========================

      const { count: hikes } = await supabase
        .from("hikes")
        .select("*", {
          count: "exact",
          head: true,
        });

      // =========================
      // CHECK-INS
      // =========================

      const { count: checkins } = await supabase
        .from("hike_participants")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("checked_in", true);

      // =========================
      // REVENUE
      // =========================

      const { data: payments } = await supabase
        .from("payments")
        .select("commission");

      const revenue =
        payments?.reduce(
          (sum, payment) =>
            sum + Number(payment.commission),
          0
        ) || 0;

      setStats({
        users: users || 0,
        hikes: hikes || 0,
        checkins: checkins || 0,
        revenue,
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Chargement...
        </p>
      </div>
    );
  }

  // =========================
  // NON AUTORISÉ
  // =========================

  if (!authorized) {
    return <Navigate to="/" />;
  }

  // =========================
  // ADMIN DASHBOARD
  // =========================

  return (
    <div className="min-h-screen bg-background p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-10">
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
    </div>
  );
}

// =========================
// CARD
// =========================

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

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}
