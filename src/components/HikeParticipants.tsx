import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

type Participant = {
  user_id: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function HikeParticipants({ hikeId }: { hikeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hike-participants", hikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hike_participants")
        .select("user_id, profile:profiles!hike_participants_user_id_fkey ( id, full_name, avatar_url )")
        .eq("hike_id", hikeId)
        .eq("status", "accepted");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
      })) as Participant[];
    },
  });

  if (isLoading) return null;
  const participants = data ?? [];

  return (
    <div className="mt-3 px-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Users className="h-3.5 w-3.5" />
        <span>
          {participants.length === 0
            ? "Aucun participant accepté"
            : `${participants.length} participant${participants.length > 1 ? "s" : ""}`}
        </span>
      </div>
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <Link
              key={p.user_id}
              to="/profile/$id"
              params={{ id: p.user_id }}
              className="flex items-center gap-1.5 rounded-full bg-secondary/60 hover:bg-secondary px-2 py-1 transition-colors"
              title={p.profile?.full_name ?? "Randonneur"}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={p.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{initials(p.profile?.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs max-w-[100px] truncate">
                {p.profile?.full_name ?? "Randonneur"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
