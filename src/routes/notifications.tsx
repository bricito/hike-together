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
        text: `New join request for "${p.hike_title}"`,
        href: "/hikes/$slug",
        params: { slug: p.hike_slug ?? "" },
      };
    case "request_accepted":
      return { text: `Your request to join "${p.hike_title}" was accepted!` };
    case "request_declined":
      return { text: `Your request to join "${p.hike_title}" was declined.` };
    case "new_message":
      return {
        text: `New message in "${p.hike_title}"`,
        href: "/messages/$hikeId",
        params: { hikeId: p.hike_id },
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

  // Realtime
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
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
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
              <Check className="h-4 w-4" /> Mark all read
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
            <p className="mt-3 font-medium">You're all caught up</p>
            <p className="text-sm text-muted-foreground mt-1">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-3xl bg-card overflow-hidden border border-border">
            {items.map((n) => {
              const Icon = iconFor(n.type);
              const { text, href, params } = labelFor(n);
              const inner = (
                <div className="flex items-start gap-3 p-4">
                  <span className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                    n.read_at ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read_at ? "text-muted-foreground" : "font-medium"}`}>{text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={(e) => { e.preventDefault(); markOne.mutate(n.id); }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Mark read"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
              return (
                <li key={n.id}>
                  {href ? (
                    <Link
                      to={href as any}
                      params={params}
                      onClick={() => !n.read_at && markOne.mutate(n.id)}
                      className="block hover:bg-secondary/40 transition"
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
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
