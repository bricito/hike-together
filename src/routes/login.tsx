import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mountain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — BlablaHike" }] }),
  component: Login,
});

function Login() {
  const { signInEmail, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInEmail(email, password);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/hikes" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-[var(--shadow-elegant)] border border-border">
          <div className="flex justify-center mb-4">
            <span className="h-12 w-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground"><Mountain className="h-6 w-6" /></span>
          </div>
          <h1 className="font-display text-3xl text-center">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Log in to join hikes and chat with hosts.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Input type="email" required placeholder="Email" className="h-12 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required placeholder="Password" className="h-12 rounded-2xl" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl">{loading ? "Logging in…" : "Log in"}</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("google")}>Continue with Google</Button>
            <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => signInWithOAuth("apple")}>Continue with Apple</Button>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4">
            New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
