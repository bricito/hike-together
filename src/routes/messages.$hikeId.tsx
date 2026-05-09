import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { fetchMessages, sendMessage, type MessageRow } from "@/lib/messages-api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages/$hikeId")({
  component: ChatRoom,
});

function ChatRoom() {
  const { hikeId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const queryKey = ["messages", hikeId];
  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchMessages(hikeId),
    enabled: !!user,
  });

  // Hike header
  const { data: hike } = useQuery({
    queryKey: ["hike-header", hikeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("hikes")
        .select("id, slug, title, cover_image_url")
        .eq("id", hikeId)
        .maybeSingle();
      return data as any;
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`messages:${hikeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `hike_id=eq.${hikeId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [hikeId, user, qc]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendMut = useMutation({
    mutationFn: (content: string) => sendMessage(hikeId, content),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send message."),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    sendMut.mutate(t);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-4 flex-1 max-w-3xl flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/messages" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {hike && (
            <Link
              to="/hikes/$slug"
              params={{ slug: hike.slug }}
              className="flex items-center gap-3 group"
            >
              <img
                src={hike.cover_image_url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=70"}
                alt=""
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div>
                <p className="font-medium group-hover:underline">{hike.title}</p>
                <p className="text-xs text-muted-foreground">Group chat</p>
              </div>
            </Link>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-3xl bg-card border border-border p-4 min-h-[60vh] max-h-[calc(100vh-260px)] space-y-3"
        >
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((m: MessageRow) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <img
                      src={m.sender?.avatar_url || "https://i.pravatar.cc/40"}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover mt-auto"
                    />
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary rounded-bl-sm"
                    }`}
                  >
                    {!mine && (
                      <p className="text-[11px] font-medium opacity-70 mb-0.5">
                        {m.sender?.full_name || "Hiker"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 mt-3 pb-20 md:pb-0">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="rounded-2xl"
          />
          <Button type="submit" disabled={sendMut.isPending || !draft.trim()} className="rounded-2xl">
            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </main>
      <MobileNav />
    </div>
  );
}
