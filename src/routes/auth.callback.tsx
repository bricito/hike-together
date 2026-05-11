import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing you in… — BlablaHike" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // detectSessionInUrl handles OAuth + email confirmation hash automatically.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return navigate({ to: "/login" });
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, bio")
        .eq("id", data.session.user.id)
        .maybeSingle();
      const incomplete = !profile || !profile.full_name?.trim() || !profile.bio?.trim();
      navigate({ to: incomplete ? "/me" : "/hikes" });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">Signing you in…</div>
  );
}
