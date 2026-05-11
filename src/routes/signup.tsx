import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mountain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — BlablaHike" }] }),
  component: Signup,
});

function Signup() {
  const { signUpEmail, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, needsConfirmation } = await signUpEmail(email, password, fullName);
    setLoading(false);
    if (error) return toast.error(error.message);
    if (needsConfirmation) {
      toast.success("Check your email to confirm your account before logging in.", { duration: 8000 });
      navigate({ to: "/login" });
      return;
    }
    toast.success("Bienvenue ! Complétez votre profil.");
    navigate({ to: "/me" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-[var(--shadow-elegant)] border border-border">
          <div className="flex justify-center mb-4">
            <span className="h-12 w-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground"><Mountain className="h-6 w-6" /></span>
          </div>
          <h1 className="font-display text-3xl text-center">Join the community</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Find your hiking crew.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Input required placeholder="Full name" className="h-12 rounded-2xl" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input required type="email" placeholder="Email" className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input required type="password" minLength={6} placeholder="Password (min 6 chars)" className="h-12 rounded-2xl" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl">{loading ? "Creating…" : "Create account"}</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("google")}>Continue with Google</Button>
            <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("apple")}>Continue with Apple</Button>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
