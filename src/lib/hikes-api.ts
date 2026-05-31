import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/hikes-data";

/* ---------------- TYPES ---------------- */

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
  lat: number | null;
  lng: number | null;
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
  distanceKm?: number;
};

/* ---------------- HELPERS ---------------- */

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80";

const FALLBACK_AVATAR = "https://i.pravatar.cc/120?img=12";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
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

function normalizeDifficulty(d: string): Difficulty {
  return d as Difficulty;
}

/* ---------------- VIEW MAPPER ---------------- */

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
    difficulty: normalizeDifficulty(h.difficulty),
    maxParticipants: h.max_participants,
    spotsLeft: Math.max(0, h.max_participants - joined),
    description: h.description ?? "",
    meetingPoint: h.meeting_point ?? "",
    equipment: h.equipment ?? [],
    priceCents: (h as any).price_cents ?? null,
    currency: (h as any).currency ?? "EUR",
    organizer: {
      id: h.organizer?.id ?? h.organizer_id,
      name: h.organizer?.full_name || "Randonneur anonyme",
      avatar: h.organizer?.avatar_url || FALLBACK_AVATAR,
      level: h.organizer?.hiking_level || "Randonneur",
    },
  };
}

/* ---------------- NORMALIZE ---------------- */

function normalize(rows: any[]): DbHike[] {
  return (rows ?? []).map((r) => ({
    ...r,
    organizer: Array.isArray(r.organizer) ? r.organizer[0] : r.organizer,
    participants_count: Array.isArray(r.participants)
      ? r.participants[0]?.count ?? 0
      : 0,
  }));
}

/* ---------------- SELECT ---------------- */

const SELECT = `
  id, slug, organizer_id, title, description, location, meeting_point,
  starts_at, duration_hours, difficulty, distance_km, elevation_m:elevation_gain_m,
  max_participants, equipment, cover_image:cover_image_url, status, created_at,
  price_cents, currency, lat, lng,
  organizer:profiles!hikes_organizer_id_fkey ( id, full_name, avatar_url, hiking_level ),
  participants:hike_participant_counts ( count )
`;

/* ---------------- PUBLIC FETCH ---------------- */

export async function fetchMyHikes(userId: string) {
  const [orgRes, partRes] = await Promise.all([
    supabase
      .from("hikes")
      .select(SELECT)
      .eq("organizer_id", userId),

    supabase
      .from("hike_participants")
      .select(`status, hike:hikes!hike_participants_hike_id_fkey ( ${SELECT} )`)
      .eq("user_id", userId),
  ]);

  if (orgRes.error) throw orgRes.error;
  if (partRes.error) throw partRes.error;

  const organized = normalize(orgRes.data as any[]).map(toView);

  const accepted: HikeView[] = [];
  const pending: HikeView[] = [];

  for (const row of (partRes.data ?? []) as any[]) {
    const raw = Array.isArray(row.hike) ? row.hike[0] : row.hike;
    if (!raw) continue;

    const view = toView(normalize([raw])[0]);

    if (row.status === "accepted") accepted.push(view);
    if (row.status === "pending") pending.push(view);
  }

  return { organized, accepted, pending };
}

/* ---------------- CREATE HIKE (IMPORTANT FIX BUILD) ---------------- */

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
  if (!u.user) throw new Error("Non connecté");

  const { data, error } = await supabase
    .from("hikes")
    .insert({
      ...input,
      difficulty: input.difficulty.toLowerCase(),
      elevation_gain_m: input.elevation_m,
      cover_image_url: input.cover_image ?? null,
      price_cents: input.price_cents ?? null,
      currency: input.currency ?? "EUR",
      organizer_id: u.user.id,
      status: "open",
    })
    .select("slug")
    .single();

  if (error) throw error;
  return data;
}

/* ---------------- OTHER EXPORTS (safe stubs if needed) ---------------- */

export async function fetchHikeBySlug(slug: string) {
  const { data, error } = await supabase
    .from("hikes")
    .select(SELECT)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return toView(normalize([data])[0]);
}
