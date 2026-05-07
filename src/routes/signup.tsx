import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mountain } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — BlablaHike" }] }),
  component: Signup,
});

function Signup() {
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
          <form className="mt-6 space-y-3">
            <Input placeholder="Full name" className="h-12 rounded-2xl" />
            <Input type="email" placeholder="Email" className="h-12 rounded-2xl" />
            <Input type="password" placeholder="Password" className="h-12 rounded-2xl" />
            <Button className="w-full h-12 rounded-2xl">Create account</Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
          </p>
          <p className="text-xs text-center text-muted-foreground mt-6">Auth coming with Lovable Cloud setup</p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
