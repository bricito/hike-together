import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mountain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Connexion — BlablaHike" }] }),
  component: Login,
});

function Login() {
  const { signInEmail, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInEmail(email, password);
    setLoading(false);
    if (error) {
      if (error.message?.toLowerCase().includes("not confirmed")) {
        return toast.error("Veuillez confirmer votre email — vérifiez votre boîte de réception.", { duration: 8000 });
      }
      return toast.error(error.message);
    }
    toast.success("Bienvenue !");
    navigate({ to: "/hikes" });
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      return toast.error(error.message);
    }
    toast.success("Email envoyé ! Vérifiez votre boîte de réception.", { duration: 8000 });
    setShowReset(false);
    setResetEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-[var(--shadow-elegant)] border border-border">
          <div className="flex justify-center mb-4">
            <span className="h-12 w-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground">
              <Mountain className="h-6 w-6" />
            </span>
          </div>

          {!showReset ? (
            <>
              <h1 className="font-display text-3xl text-center">Bon retour !</h1>
              <p className="text-sm text-muted-foreground text-center mt-1">Connectez-vous pour rejoindre des randonnées.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                <Input type="email" required placeholder="Email" className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" required placeholder="Mot de passe" className="h-12 rounded-2xl" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowReset(true); setResetEmail(email); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl">
                  {loading ? "Connexion…" : "Se connecter"}
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />OU<div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("google")}>Continuer avec Google</Button>
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("apple")}>Continuer avec Apple</Button>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4">
                Nouveau ? <Link to="/signup" className="text-primary hover:underline">Créer un compte</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-center">Mot de passe oublié</h1>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <form onSubmit={onResetPassword} className="mt-6 space-y-3">
                <Input
                  type="email"
                  required
                  placeholder="Votre email"
                  className="h-12 rounded-2xl"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <Button type="submit" disabled={resetLoading} className="w-full h-12 rounded-2xl">
                  {resetLoading ? "Envoi…" : "Envoyer le lien"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="text-sm text-primary hover:underline text-center w-full mt-4 block"
              >
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
