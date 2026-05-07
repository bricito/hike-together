import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create a hike — BlablaHike" }] }),
  component: Create,
});

function Create() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl">Create a hike</h1>
        <p className="text-muted-foreground mt-2">Share your next adventure with the community.</p>

        <form className="mt-8 space-y-4">
          <Field label="Hike title"><Input placeholder="Sunrise loop at Emerald Lake" className="h-12 rounded-2xl" /></Field>
          <Field label="Location"><Input placeholder="Chamonix, France" className="h-12 rounded-2xl" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" className="h-12 rounded-2xl" /></Field>
            <Field label="Time"><Input type="time" className="h-12 rounded-2xl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (h)"><Input type="number" placeholder="5" className="h-12 rounded-2xl" /></Field>
            <Field label="Elevation gain (m)"><Input type="number" placeholder="600" className="h-12 rounded-2xl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Difficulty">
              <select className="w-full h-12 rounded-2xl border border-input bg-background px-3 text-sm">
                <option>Easy</option><option>Moderate</option><option>Hard</option><option>Expert</option>
              </select>
            </Field>
            <Field label="Max participants"><Input type="number" placeholder="8" className="h-12 rounded-2xl" /></Field>
          </div>
          <Field label="Meeting point"><Input placeholder="Parking des Praz" className="h-12 rounded-2xl" /></Field>
          <Field label="Description">
            <textarea rows={5} placeholder="Tell hikers what to expect..." className="w-full rounded-2xl border border-input bg-background p-3 text-sm" />
          </Field>
          <Field label="Equipment needed"><Input placeholder="Boots, water, headlamp" className="h-12 rounded-2xl" /></Field>

          <Button className="w-full h-12 rounded-2xl mt-4">Publish hike</Button>
          <p className="text-xs text-center text-muted-foreground">Backend with Lovable Cloud needed to save hikes.</p>
        </form>
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
