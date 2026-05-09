import { Link } from "@tanstack/react-router";
import { Bell, Mountain, MessageCircle, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, signOut } = useAuth();

  const { data: unread = 0, refetch } = useQuery({
    queryKey: ["unread-notifs", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      return count ?? 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`hdr-notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refetch]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="font-display text-xl">BlablaHike</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/hikes" className="hover:text-foreground transition-colors">Découvrir</Link>
          <Link to="/create" className="hover:text-foreground transition-colors">Créer une randonnée</Link>
          {user && (
            <Link to="/messages" className="hover:text-foreground transition-colors">Messages</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex">
                <Link to="/messages" aria-label="Messages"><MessageCircle className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative rounded-full">
                <Link to="/notifications" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex" onClick={() => signOut()} aria-label="Se déconnecter">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Se connecter</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/signup">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
