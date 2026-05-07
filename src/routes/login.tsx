import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mountain } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — BlablaHike" }] }),
  component: Login,
});

function Login() {
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
          <form className="mt-6 space-y-3">
            <Input type="email" placeholder="Email" className="h-12 rounded-2xl" />
            <Input type="password" placeholder="Password" className="h-12 rounded-2xl" />
            <Button className="w-full h-12 rounded-2xl">Log in</Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
          </p>
          <p className="text-xs text-center text-muted-foreground mt-6">Auth coming with Lovable Cloud setup</p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
