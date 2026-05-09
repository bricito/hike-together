import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/lib/auth-context";
import { fetchMyConversations } from "@/lib/messages-api";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: convos = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchMyConversations(user!.id),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        <h1 className="font-display text-3xl mb-6">Messages</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : convos.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center border border-border">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Join or host a hike to start chatting with other hikers.
            </p>
            <Link to="/hikes" className="text-primary text-sm hover:underline mt-3 inline-block">
              Browse hikes →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-3xl bg-card overflow-hidden border border-border">
            {convos.map((c) => (
              <li key={c.hikeId}>
                <Link
                  to="/messages/$hikeId"
                  params={{ hikeId: c.hikeId }}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition"
                >
                  <img
                    src={c.hikeImage || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=70"}
                    alt={c.hikeTitle}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.hikeTitle}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.lastMessage || "No messages yet — say hi!"}
                    </p>
                  </div>
                  {c.lastAt && (
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(c.lastAt).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
