import { supabase } from "@/integrations/supabase/client";

export type ReviewRole = "organizer_to_participant" | "participant_to_organizer";

export type Review = {
  id: string;
  hike_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  role: ReviewRole;
  rating: number;
  badge_punctual: boolean;
  badge_friendly: boolean;
  badge_safe: boolean;
  comment: string | null;
  created_at: string;
  hike?: { title: string; slug: string } | null;
  reviewer?: { full_name: string | null; avatar_url: string | null } | null;
};

export type ReviewInput = {
  hike_id: string;
  reviewed_user_id: string;
  role: ReviewRole;
  rating: number;
  badge_punctual: boolean;
  badge_friendly: boolean;
  badge_safe: boolean;
  comment?: string;
};

// -------------------------------------------------------
// Fenêtre de notation : 24h après la fin → 7 jours max
// -------------------------------------------------------
export function reviewWindowStatus(
  starts_at: string,
  duration_hours: number,
): "not_yet" | "open" | "closed" {
  const endMs =
    new Date(starts_at).getTime() + duration_hours * 60 * 60 * 1000;
  const nowMs = Date.now();
  const openMs  = endMs + 24 * 60 * 60 * 1000;       // +24h
  const closeMs = endMs + (24 + 7 * 24) * 60 * 60 * 1000; // +24h+7j

  if (nowMs < openMs)  return "not_yet";
  if (nowMs > closeMs) return "closed";
  return "open";
}

// -------------------------------------------------------
// Soumettre un avis
// -------------------------------------------------------
export async function submitReview(input: ReviewInput): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Connexion requise.");

  const { error } = await supabase.from("reviews").insert({
    hike_id:          input.hike_id,
    reviewer_id:      u.user.id,
    reviewed_user_id: input.reviewed_user_id,
    role:             input.role,
    rating:           input.rating,
    badge_punctual:   input.badge_punctual,
    badge_friendly:   input.badge_friendly,
    badge_safe:       input.badge_safe,
    comment:          input.comment ?? null,
  });

  if (error) {
    if (error.code === "23505")
      throw new Error("Vous avez déjà laissé un avis pour cette randonnée.");
    throw error;
  }
}

// -------------------------------------------------------
// Avis reçus par un utilisateur (pour son profil public)
// -------------------------------------------------------
export async function fetchReviewsForUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      hike:hikes!reviews_hike_id_fkey ( title, slug ),
      reviewer:profiles!reviews_reviewer_id_fkey ( full_name, avatar_url )
    `)
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    ...r,
    hike:     Array.isArray(r.hike)     ? r.hike[0]     : r.hike,
    reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
  }));
}

// -------------------------------------------------------
// Vérifier si l'utilisateur connecté a déjà noté quelqu'un
// pour une rando donnée
// -------------------------------------------------------
export async function fetchMyReviewForHike(
  hikeId: string,
  reviewedUserId: string,
): Promise<Review | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("hike_id", hikeId)
    .eq("reviewer_id", u.user.id)
    .eq("reviewed_user_id", reviewedUserId)
    .maybeSingle();

  if (error) throw error;
  return (data as Review) ?? null;
}

// -------------------------------------------------------
// Randonnées terminées pour lesquelles l'user peut noter
// (organisateur → participants ou participant → organisateur)
// -------------------------------------------------------
export type PendingReviewTarget = {
  hikeId: string;
  hikeTitle: string;
  hikeSlug: string;
  starts_at: string;
  duration_hours: number;
  targetUserId: string;
  targetName: string;
  targetAvatar: string | null;
  role: ReviewRole;
  alreadyReviewed: boolean;
};

export async function fetchPendingReviews(
  userId: string,
): Promise<PendingReviewTarget[]> {
  // 1. Randonnées organisées par l'user (il note les participants acceptés)
  const { data: organized, error: e1 } = await supabase
    .from("hikes")
    .select(`
      id, title, slug, starts_at, duration_hours,
      participants:hike_participants (
        id, user_id, status,
        profile:profiles!hike_participants_user_id_fkey ( full_name, avatar_url )
      )
    `)
    .eq("organizer_id", userId);
  if (e1) throw e1;

  // 2. Randonnées où l'user a participé (il note l'organisateur)
  const { data: participated, error: e2 } = await supabase
    .from("hike_participants")
    .select(`
      status,
      hike:hikes!hike_participants_hike_id_fkey (
        id, title, slug, starts_at, duration_hours, organizer_id,
        organizer:profiles!hikes_organizer_id_fkey ( full_name, avatar_url )
      )
    `)
    .eq("user_id", userId)
    .eq("status", "accepted");
  if (e2) throw e2;

  // 3. Avis déjà soumis par l'user
  const { data: myReviews, error: e3 } = await supabase
    .from("reviews")
    .select("hike_id, reviewed_user_id")
    .eq("reviewer_id", userId);
  if (e3) throw e3;

  const alreadySet = new Set(
    (myReviews ?? []).map((r: any) => `${r.hike_id}:${r.reviewed_user_id}`),
  );

  const results: PendingReviewTarget[] = [];

  // Organisateur → chaque participant accepté
  for (const hike of organized ?? []) {
    const h = hike as any;
    const window = reviewWindowStatus(h.starts_at, h.duration_hours ?? 0);
    if (window === "not_yet") continue;

    for (const p of h.participants ?? []) {
      if (p.status !== "accepted") continue;
      if (p.user_id === userId) continue; // ne pas se noter soi-même
      const profile = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      results.push({
        hikeId:        h.id,
        hikeTitle:     h.title,
        hikeSlug:      h.slug,
        starts_at:     h.starts_at,
        duration_hours: h.duration_hours ?? 0,
        targetUserId:  p.user_id,
        targetName:    profile?.full_name ?? "Randonneur",
        targetAvatar:  profile?.avatar_url ?? null,
        role:          "organizer_to_participant",
        alreadyReviewed: alreadySet.has(`${h.id}:${p.user_id}`),
      });
    }
  }

  // Participant → organisateur
  for (const row of participated ?? []) {
    const r = row as any;
    const h = Array.isArray(r.hike) ? r.hike[0] : r.hike;
    if (!h) continue;
    const window = reviewWindowStatus(h.starts_at, h.duration_hours ?? 0);
    if (window === "not_yet") continue;

    const organizer = Array.isArray(h.organizer) ? h.organizer[0] : h.organizer;
    results.push({
      hikeId:         h.id,
      hikeTitle:      h.title,
      hikeSlug:       h.slug,
      starts_at:      h.starts_at,
      duration_hours: h.duration_hours ?? 0,
      targetUserId:   h.organizer_id,
      targetName:     organizer?.full_name ?? "Organisateur",
      targetAvatar:   organizer?.avatar_url ?? null,
      role:           "participant_to_organizer",
      alreadyReviewed: alreadySet.has(`${h.id}:${h.organizer_id}`),
    });
  }

  return results;
}

// -------------------------------------------------------
// Stats résumées pour l'affichage du profil
// -------------------------------------------------------
export type ReviewStats = {
  count: number;
  average: number;
  badgePunctual: number;
  badgeFriendly: number;
  badgeSafe: number;
};

export function computeStats(reviews: Review[]): ReviewStats {
  if (reviews.length === 0)
    return { count: 0, average: 0, badgePunctual: 0, badgeFriendly: 0, badgeSafe: 0 };

  const count = reviews.length;
  const average =
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
  const badgePunctual = reviews.filter((r) => r.badge_punctual).length;
  const badgeFriendly = reviews.filter((r) => r.badge_friendly).length;
  const badgeSafe     = reviews.filter((r) => r.badge_safe).length;

  return { count, average, badgePunctual, badgeFriendly, badgeSafe };
}
