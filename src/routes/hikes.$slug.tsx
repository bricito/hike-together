import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Users, MapPin, Calendar, Backpack, Mountain, Loader2, Check, X } from "lucide-react";
import { fetchHikeBySlug, fetchPublicHikes, fetchMyParticipation, requestToJoinHike, cancelJoinRequest } from "@/lib/hikes-api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/hikes/$slug")({
  loader: async ({ params }) => {
    const hike = await fetchHikeBySlug(params.slug);
    if (!hike) throw notFound();
    return { hike };
  },
  head: ({ loaderData }) => {
    const h = loaderData?.hike;
    if (!h) return { meta: [{ title: "Hike — BlablaHike" }] };
    return {
      meta: [
        { title: `${h.title} — BlablaHike` },
        { name: "description", content: `${h.title} in ${h.location}. ${h.difficulty} hike, ${h.durationHours}h, ${h.elevationM}m elevation. Join the group on BlablaHike.` },
        { property: "og:title", content: h.title },
        { property: "og:description", content: `${h.location} · ${h.date}` },
        { property: "og:image", content: h.image },
        { property: "twitter:image", content: h.image },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center"><h1 className="font-display text-3xl">Hike not found</h1>
        <Link to="/hikes" className="text-primary hover:underline mt-3 inline-block">Browse hikes</Link></div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center"><p>{error.message}</p></div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  ),
  component: HikeDetail,
});

function HikeDetail() {
  const { hike } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const participationKey = ["participation", hike.id, user?.id];
  const { data: participation } = useQuery({
    queryKey: participationKey,
    queryFn: () => fetchMyParticipation(hike.id, user!.id),
    enabled: !!user,
  });

  const joinMut = useMutation({
    mutationFn: () => requestToJoinHike(hike.id),
    onSuccess: (data) => {
      qc.setQueryData(participationKey, data);
      toast.success("Request sent! The host will review it shortly.");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send request."),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelJoinRequest(participation!.id),
    onSuccess: () => {
      qc.setQueryData(participationKey, null);
      toast.success("Request cancelled.");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not cancel request."),
  });

  const isOrganizer = user?.id === hike.organizer.id;

  const { data: others = [] } = useQuery({
    queryKey: ["hikes", "others", hike.id],
    queryFn: () => fetchPublicHikes({ limit: 4 }),
    select: (rows) => rows.filter((h) => h.id !== hike.id).slice(0, 3),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="container mx-auto px-4 pt-6">
        <Link to="/hikes" className="text-sm text-muted-foreground hover:text-foreground">← Back to hikes</Link>
      </div>

      <section className="container mx-auto px-4 pt-4">
        <div className="rounded-4xl overflow-hidden relative aspect-[16/9] md:aspect-[21/9]">
          <img src={hike.image} alt={hike.title} className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="container mx-auto px-4 mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{hike.difficulty}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{hike.location}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">{hike.title}</h1>

          <div className="flex flex-wrap gap-6 mt-6 text-sm">
            <Stat icon={Calendar} label="Date" value={hike.date} />
            <Stat icon={Clock} label="Duration" value={`${hike.durationHours}h`} />
            <Stat icon={TrendingUp} label="Elevation" value={`${hike.elevationM}m`} />
            <Stat icon={Users} label="Group" value={`${hike.maxParticipants - hike.spotsLeft}/${hike.maxParticipants}`} />
          </div>

          <div className="mt-10 flex items-center gap-4 p-5 rounded-3xl bg-card shadow-[var(--shadow-soft)]">
            <img src={hike.organizer.avatar} alt={hike.organizer.name} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-xs text-muted-foreground">Hosted by</p>
              <p className="font-medium">{hike.organizer.name}</p>
              <p className="text-xs text-muted-foreground">{hike.organizer.level} hiker</p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">About this hike</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{hike.description}</p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">Meeting point</h2>
            <div className="rounded-3xl overflow-hidden border border-border bg-secondary/40 aspect-[16/9] grid place-items-center text-muted-foreground relative">
              <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at 30% 40%, var(--primary-glow), transparent 60%), radial-gradient(circle at 70% 70%, var(--accent), transparent 50%)" }} />
              <div className="relative text-center">
                <Mountain className="h-10 w-10 mx-auto text-primary" />
                <p className="mt-2 font-medium text-foreground">{hike.meetingPoint || "Shared after you join"}</p>
                <p className="text-xs">Interactive map coming soon</p>
              </div>
            </div>
          </div>

          {hike.equipment.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl mb-3">What to bring</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {hike.equipment.map((e: string) => (
                  <li key={e} className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 text-sm">
                    <Backpack className="h-4 w-4 text-primary" /> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-elegant)] border border-border">
            <p className="text-sm text-muted-foreground">Join this hike</p>
            <p className="font-display text-2xl mt-1">{hike.spotsLeft} spots left</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hike.priceCents != null && hike.priceCents > 0
                ? `${(hike.priceCents / 100).toFixed(2)} ${hike.currency} per person · Community organized`
                : "Free · Community organized"}
            </p>

            {isOrganizer ? (
              <div className="mt-5 p-3 rounded-2xl bg-secondary/50 text-sm text-center text-muted-foreground">
                You're hosting this hike
              </div>
            ) : !user ? (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-2xl mt-5"
                  onClick={() => navigate({ to: "/login", search: { redirect: `/hikes/${hike.slug}` } as any })}
                >
                  Sign up to join
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-3">You'll need an account to join</p>
              </>
            ) : participation?.status === "pending" ? (
              <>
                <div className="mt-5 p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Request pending
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl mt-2"
                  disabled={cancelMut.isPending}
                  onClick={() => cancelMut.mutate()}
                >
                  <X className="h-4 w-4" /> Cancel request
                </Button>
              </>
            ) : participation?.status === "accepted" ? (
              <div className="mt-5 p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> You're going!
              </div>
            ) : participation?.status === "declined" ? (
              <div className="mt-5 p-3 rounded-2xl bg-secondary/60 text-sm text-center text-muted-foreground">
                Your request wasn't accepted this time.
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full rounded-2xl mt-5"
                disabled={joinMut.isPending || hike.spotsLeft === 0}
                onClick={() => joinMut.mutate()}
              >
                {joinMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hike.spotsLeft === 0 ? "Hike full" : "Request to join"}
              </Button>
            )}

            {!isOrganizer && <Button variant="outline" className="w-full rounded-2xl mt-2">Message host</Button>}
          </div>
        </aside>
      </section>

      {others.length > 0 && (
        <section className="container mx-auto px-4 mt-20">
          <h2 className="font-display text-2xl mb-6">Other hikes you might like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((h) => (
              <Link key={h.id} to="/hikes/$slug" params={{ slug: h.slug }} className="group rounded-3xl overflow-hidden bg-card shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all">
                <div className="aspect-[4/3] overflow-hidden"><img src={h.image} alt={h.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{h.location}</p>
                  <p className="font-medium mt-1">{h.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
      <MobileNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
