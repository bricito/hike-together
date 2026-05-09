import { supabase } from "@/integrations/supabase/client";

export type MessageRow = {
  id: string;
  hike_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export type Conversation = {
  hikeId: string;
  hikeSlug: string;
  hikeTitle: string;
  hikeImage: string | null;
  lastMessage: string | null;
  lastAt: string | null;
};

export async function fetchMessages(hikeId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id, hike_id, sender_id, content, created_at,
      sender:profiles!messages_sender_id_fkey ( id, full_name, avatar_url )
    `)
    .eq("hike_id", hikeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    sender: Array.isArray(r.sender) ? r.sender[0] : r.sender,
  }));
}

export async function sendMessage(hikeId: string, content: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in required.");
  const { error } = await supabase.from("messages").insert({
    hike_id: hikeId,
    sender_id: u.user.id,
    content,
  });
  if (error) throw error;
}

export async function fetchMyConversations(userId: string): Promise<Conversation[]> {
  // Hikes the user organizes
  const { data: organized, error: e1 } = await supabase
    .from("hikes")
    .select("id, slug, title, cover_image_url")
    .eq("organizer_id", userId);
  if (e1) throw e1;

  // Hikes the user is accepted in
  const { data: joined, error: e2 } = await supabase
    .from("hike_participants")
    .select("hike:hikes!hike_participants_hike_id_fkey ( id, slug, title, cover_image_url )")
    .eq("user_id", userId)
    .eq("status", "accepted");
  if (e2) throw e2;

  const map = new Map<string, { id: string; slug: string; title: string; cover: string | null }>();
  (organized ?? []).forEach((h: any) =>
    map.set(h.id, { id: h.id, slug: h.slug, title: h.title, cover: h.cover_image_url }),
  );
  (joined ?? []).forEach((r: any) => {
    const h = Array.isArray(r.hike) ? r.hike[0] : r.hike;
    if (h) map.set(h.id, { id: h.id, slug: h.slug, title: h.title, cover: h.cover_image_url });
  });

  const ids = Array.from(map.keys());
  if (ids.length === 0) return [];

  const { data: lastMsgs } = await supabase
    .from("messages")
    .select("hike_id, content, created_at")
    .in("hike_id", ids)
    .order("created_at", { ascending: false });

  const lastByHike = new Map<string, { content: string; created_at: string }>();
  (lastMsgs ?? []).forEach((m: any) => {
    if (!lastByHike.has(m.hike_id)) lastByHike.set(m.hike_id, m);
  });

  return ids
    .map((id) => {
      const h = map.get(id)!;
      const m = lastByHike.get(id);
      return {
        hikeId: id,
        hikeSlug: h.slug,
        hikeTitle: h.title,
        hikeImage: h.cover,
        lastMessage: m?.content ?? null,
        lastAt: m?.created_at ?? null,
      };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

// ===== Pending join requests (organizer view) =====
export type PendingRequest = {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  user: { id: string; full_name: string | null; avatar_url: string | null; hiking_level: string | null } | null;
};

export async function fetchHikeRequests(hikeId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from("hike_participants")
    .select(`
      id, user_id, created_at, status,
      user:profiles!hike_participants_user_id_fkey ( id, full_name, avatar_url, hiking_level )
    `)
    .eq("hike_id", hikeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    user: Array.isArray(r.user) ? r.user[0] : r.user,
  }));
}

export async function respondToRequest(participantId: string, status: "accepted" | "declined") {
  const { error } = await supabase
    .from("hike_participants")
    .update({ status })
    .eq("id", participantId);
  if (error) throw error;
}

// ===== Notifications =====
export type Notification = {
  id: string;
  user_id: string;
  type: string;
  payload: any;
  read_at: string | null;
  created_at: string;
};

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}
