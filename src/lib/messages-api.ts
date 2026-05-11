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
  if (!u.user) throw new Error("Connexion requise.");
  const { error } = await supabase.from("messages").insert({
    hike_id: hikeId,
    sender_id: u.user.id,
    content,
  });
  if (error) throw error;
}

export async function fetchMyConversations(userId: string): Promise<Conversation[]> {
  const { data: organized, error: e1 } = await supabase
    .from("hikes")
    .select("id, slug, title, cover_image_url")
    .eq("organizer_id", userId);
  if (e1) throw e1;

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

// Décharge de responsabilité
const LIABILITY_TEXT_VERSION = "v1.0-2026";
const LIABILITY_TEXT = `Je reconnais que la participation à une randonnée comporte des risques inhérents, notamment mais sans s'y limiter : chutes, blessures, conditions météorologiques imprévisibles, terrain difficile ou accidenté. Je déclare être en condition physique suffisante pour participer à cette activité et disposer d'un équipement adapté.

Je comprends que l'organisateur agit en tant que particulier ou facilitateur et non en tant que professionnel encadrant, sauf indication contraire explicite.

En conséquence, j'accepte de participer sous ma propre responsabilité et renonce, dans les limites autorisées par la loi, à tout recours contre l'organisateur en cas d'accident, de blessure ou de dommage survenu lors de la randonnée, sauf en cas de faute lourde ou intentionnelle de sa part.

Je m'engage à respecter les consignes de sécurité, à adopter un comportement prudent et à ne pas mettre en danger les autres participants.

Je reconnais avoir pris connaissance des présentes conditions et les accepter sans réserve.`;

export { LIABILITY_TEXT, LIABILITY_TEXT_VERSION };

export async function saveLiabilityAcceptance(userId: string, hikeId: string) {
  const { error } = await supabase.from("liability_acceptances").insert({
    user_id: userId,
    hike_id: hikeId,
    accepted_at: new Date().toISOString(),
    text_version: LIABILITY_TEXT_VERSION,
  });
  if (error) throw error;
}

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
import { sendPushNotification } from "./onesignal";

// Dans respondToRequest — notifie le participant quand accepté/refusé
export async function respondToRequest(participantId: string, status: "accepted" | "declined") {
  const { error } = await supabase
    .from("hike_participants")
    .update({ status })
    .eq("id", participantId);
  if (error) throw error;

  // Récupère les infos pour la notification
  const { data: participant } = await supabase
    .from("hike_participants")
    .select(`
      user_id,
      hike:hikes!hike_participants_hike_id_fkey ( title, slug )
    `)
    .eq("id", participantId)
    .single();

  if (participant) {
    const hike = Array.isArray(participant.hike) ? participant.hike[0] : participant.hike;
    const message = status === "accepted"
      ? `✅ Votre demande pour "${hike?.title}" a été acceptée !`
      : `❌ Votre demande pour "${hike?.title}" n'a pas été retenue.`;

    await sendPushNotification({
      userIds: [participant.user_id],
      title: "BlablaHike",
      message,
      url: `https://www.blablahike.eu/hikes/${hike?.slug}`,
    });

    // Sauvegarde aussi en base
    await supabase.from("notifications").insert({
      user_id: participant.user_id,
      type: status === "accepted" ? "request_accepted" : "request_declined",
      payload: { hike_title: hike?.title, hike_slug: hike?.slug },
    });
  }
}
