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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hikes" });
      else navigate({ to: "/login" });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">Signing you in…</div>
  );
}
