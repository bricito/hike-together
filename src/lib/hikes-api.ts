import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/hikes-data";

export type DbHike = {
  id: string;
  slug: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string;
  meeting_point: string | null;
  starts_at: string;
  duration_hours: number | null;
  difficulty: Difficulty;
  distance_km: number | null;
  elevation_m: number | null;
  max_participants: number;
  equipment: string[] | null;
  cover_image: string | null;
  status: string;
  created_at: string;
  organizer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    hiking_level: string | null;
  } | null;
  participants_count?: number;
};

export type HikeView = {
  id: string;
  slug: string;
  title: string;
  location: string;
  image: string;
  date: string;
  starts_at: string;
  durationHours: number;
  elevationM: number;
  difficulty: Difficulty;
  spotsLeft: number;
  maxParticipants: number;
  description: string;
  meetingPoint: string;
  equipment: string[];
  priceCents: number | null;
  currency: string;
  organizer: { id: string; name: string; avatar: string; level: string };
};

const DIFF_MAP: Record<string, Difficulty> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  expert: "Expert",
};
function normalizeDifficulty(d: string): Difficulty {
  const k = (d ?? "").toLowerCase();
  return DIFF_MAP[k] ?? (d as Difficulty);
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80";
const FALLBACK_AVATAR = "https://i.pravatar.cc/120?img=12";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function toView(h: DbHike): HikeView {
  const joined = h.participants_count ?? 0;
  return {
    id: h.id,
    slug: h.slug,
    title: h.title,
    location: h.location,
    image: h.cover_image || FALLBACK_IMG,
    date: fmtDate(h.starts_at),
    starts_at: h.starts_at,
    durationHours: h.duration_hours ?? 0,
    elevationM: h.elevation_m ?? 0,
    difficulty: normalizeDifficulty(h.difficulty as any),
    maxParticipants: h.max_participants,
    spotsLeft: Math.max(0, h.max_participants - joined),
    description: h.description ?? "",
    meetingPoint: h.meeting_point ?? "",
    equipment: h.equipment ?? [],
    priceCents: (h as any).price_cents ?? null,
    currency: (h as any).currency ?? "EUR",
    organizer: {
      id: h.organizer?.id ?? h.organizer_id,
      name: h.organizer?.full_name || "Anonymous hiker",
      avatar: h.organizer?.avatar_url || FALLBACK_AVATAR,
      level: h.organizer?.hiking_level || "Hiker",
    },
  };
}

const SELECT = `
  id, slug, organizer_id, title, description, location, meeting_point,
  starts_at, duration_hours, difficulty, distance_km, elevation_m:elevation_gain_m,
  max_participants, equipment, cover_image:cover_image_url, status, created_at,
  price_cents, currency,
  organizer:profiles!hikes_organizer_id_fkey ( id, full_name, avatar_url, hiking_level ),
  participants:hike_participants ( count )
`;

function normalize(rows: any[]): DbHike[] {
  return (rows ?? []).map((r) => ({
    ...r,
    organizer: Array.isArray(r.organizer) ? r.organizer[0] : r.organizer,
    participants_count: Array.isArray(r.participants)
      ? r.participants[0]?.count ?? 0
      : 0,
  }));
}

export async function fetchPublicHikes(opts?: {
  limit?: number;
  search?: string;
  difficulty?: Difficulty | "All";
}): Promise<HikeView[]> {
  let q = supabase
    .from("hikes")
    .select(SELECT)
    .in("status", ["open", "full"])
    .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
    .order("starts_at", { ascending: true });

  if (opts?.limit) q = q.limit(opts.limit);
  if (opts?.difficulty && opts.difficulty !== "All")
    q = q.eq("difficulty", opts.difficulty.toLowerCase());
  if (opts?.search)
    q = q.or(
      `title.ilike.%${opts.search}%,location.ilike.%${opts.search}%`,
    );

  const { data, error } = await q;
  if (error) throw error;
  return normalize(data as any[]).map(toView);
}

export async function fetchHikeBySlug(slug: string): Promise<HikeView | null> {
  const { data, error } = await supabase
    .from("hikes")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toView(normalize([data])[0]);
}

export type ParticipantStatus = "pending" | "accepted" | "declined" | "cancelled";

export async function fetchMyParticipation(
  hikeId: string,
  userId: string,
): Promise<{ id: string; status: ParticipantStatus } | null> {
  const { data, error } = await supabase
    .from("hike_participants")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function requestToJoinHike(hikeId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("You must be signed in.");
  const { data, error } = await supabase
    .from("hike_participants")
    .insert({ hike_id: hikeId, user_id: u.user.id, status: "pending" })
    .select("id, status")
    .single();
  if (error) throw error;
  return data as { id: string; status: ParticipantStatus };
}

export async function cancelJoinRequest(participantId: string) {
  const { error } = await supabase
    .from("hike_participants")
    .delete()
    .eq("id", participantId);
  if (error) throw error;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createHike(input: {
  title: string;
  location: string;
  starts_at: string;
  duration_hours: number;
  elevation_m: number;
  difficulty: Difficulty;
  max_participants: number;
  meeting_point: string;
  description: string;
  equipment: string[];
  cover_image?: string | null;
  price_cents?: number | null;
  currency?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("You must be signed in.");
  const baseSlug = slugify(input.title) || "hike";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const { elevation_m, cover_image, price_cents, currency, difficulty, ...rest } = input;
  const { data, error } = await supabase
    .from("hikes")
    .insert({
      ...rest,
      difficulty: difficulty.toLowerCase(),
      elevation_gain_m: elevation_m,
      cover_image_url: cover_image ?? null,
      price_cents: price_cents ?? null,
      currency: currency ?? "EUR",
      slug,
      organizer_id: u.user.id,
      status: "open",
    })
    .select("slug")
    .single();
  if (error) throw error;
  return data;
}
