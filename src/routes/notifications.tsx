import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, Check, Loader2, MessageCircle, UserPlus, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToRequest,
  type Notification,
} from "@/lib/messages-api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function iconFor(type: string) {
  if (type === "join_request") return UserPlus;
  if (type === "new_message") return MessageCircle;
  return Bell;
}

function labelFor(n: Notification): { text: string; href?: string; params?: any } {
  const p = n.payload || {};
  switch (n.type) {
    case "join_request":
      return {
        text: `${p.user_name || "Quelqu'un"} souhaite rejoindre "${p.hike_title}"`,
        href: "/hikes/$slug",
        params: { slug: p.hike_slug ?? "" },
      };
    case "request_accepted":
      return {
        text: `✅ Votre demande pour "${p.hike_title}" a été acceptée !`,
        href: "/hikes/$slug",
        params: { slug: p.hike_slug ?? "" },
      };
    case "request_declined":
      return { text: `❌ Votre demande pour "${p.hike_title}" n'a pas été retenue.` };
    case "new_message":
      return {
        text: `💬 Nouveau message dans "${p.hike_title}"`,
        href: "/messages/$hikeId",
        params: { hikeId: p.hike_id },
      };
    case "reminder_24h":
      return {
        text: `⏰ Rappel : "${p.hike_title}" commence demain !`,
        href: "/hikes/$slug",
        params: { slug: p.hike_slug ?? "" },
      };
    default:
      return { text: n.type };
  }
}

function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const queryKey = ["notifications", user?.id];
  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const respondMut = useMutation({
    mutationFn: ({ participantId, status }: { participantId: string; status: "accepted" | "declined" }) =>
      respondToRequest(participantId, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey });
      const msg = vars.status === "accepted" ? "Demande acceptée ✅" : "Demande refusée.";
      import("sonner").then(({ toast }) => toast.success(msg));
    },
  });

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl">Notifications</h1>
          {unread > 0 && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => markAll.mutate()}>
              <Check className="h-4 w-4" /> Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center border border-border">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">Vous êtes à jour !</p>
            <p className="text-sm text-muted-foreground mt-1">Aucune notification pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-3xl bg-card overflow-hidden border border-border">
            {items.map((n) => {
              const Icon = iconFor(n.type);
              const { text, href, params } = labelFor(n);
              const p = n.payload || {};
              const isJoinRequest = n.type === "join_request" && p.participant_id && !p.responded;

              const inner = (
                <div className="flex items-start gap-3 p-4">
                  <span className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                    n.read_at ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read_at ? "text-muted-foreground" : "font-medium"}`}>{text}</p>
                    {p.user_avatar && (
                      <div className="flex items-center gap-2 mt-1">
                        <img src={p.user_avatar} alt="" className="h-5 w-5 rounded-full" />
                        <span className="text-xs text-muted-foreground">{p.user_name}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleString("fr-FR")}
                    </p>
                    {/* Boutons accepter/refuser directement dans la notification */}
                    {isJoinRequest && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="rounded-2xl gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                          disabled={respondMut.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            respondMut.mutate({ participantId: p.participant_id, status: "accepted" });
                            markOne.mutate(n.id);
                          }}
                        >
                          <Check className="h-3 w-3" /> Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-2xl gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          disabled={respondMut.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            respondMut.mutate({ participantId: p.participant_id, status: "declined" });
                            markOne.mutate(n.id);
                          }}
                        >
                          <X className="h-3 w-3" /> Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={(e) => { e.preventDefault(); markOne.mutate(n.id); }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Marquer comme lu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );

              return (
                <li key={n.id}>
                  {href && !isJoinRequest ? (
                    <Link
                      to={href as any}
                      params={params}
                      onClick={() => !n.read_at && markOne.mutate(n.id)}
                      className="block hover:bg-secondary/40 transition"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="hover:bg-secondary/40 transition">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
