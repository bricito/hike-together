import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RADIUS_KM = 50;

serve(async (req) => {
  const { record } = await req.json(); // payload du trigger Postgres
  const hike = record;

  if (!hike.latitude || !hike.longitude) {
    return new Response("No coordinates on hike", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Récupérer les users proches avec PostGIS
  const { data: nearbyUsers, error } = await supabase.rpc("get_users_near_hike", {
    hike_lat: hike.latitude,
    hike_lng: hike.longitude,
    radius_km: RADIUS_KM,
    exclude_user_id: hike.created_by, // ne pas notifier le créateur
  });

  if (error) {
    console.error("Error fetching nearby users:", error);
    return new Response(JSON.stringify(error), { status: 500 });
  }

  if (!nearbyUsers || nearbyUsers.length === 0) {
    return new Response("No nearby users", { status: 200 });
  }

  // Envoyer les emails via Resend (batch)
  const emails = nearbyUsers.map((user: { email: string; full_name: string }) => ({
    from: "BlablaHike <no-reply@tondomaine.com>",
    to: user.email,
    subject: `🥾 Nouvelle rando près de chez vous : ${hike.title}`,
    html: buildEmailHtml(user, hike),
  }));

  // Resend batch : max 100 emails par appel (largement suffisant en gratuit)
  const resendRes = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emails),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error("Resend error:", err);
    return new Response(err, { status: 500 });
  }

  return new Response(
    JSON.stringify({ sent: emails.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

function buildEmailHtml(user: { full_name: string }, hike: Record<string, unknown>) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #2d6a4f;">🥾 Nouvelle rando près de chez vous !</h2>
      <p>Bonjour ${user.full_name ?? "randonneur"},</p>
      <p>Une nouvelle randonnée vient d'être publiée à moins de 50 km de votre position :</p>
      <div style="background: #f0f4f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>${hike.title}</strong><br/>
        📍 ${hike.location_name ?? ""}<br/>
        📅 ${hike.date ? new Date(hike.date as string).toLocaleDateString("fr-FR") : "Date à confirmer"}<br/>
        👥 ${hike.max_participants ?? "?"} participants max
      </div>
      <a href="https://tonapp.com/hikes/${hike.id}"
         style="background: #2d6a4f; color: white; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; display: inline-block;">
        Voir la randonnée
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Pour ne plus recevoir ces notifications, modifiez vos préférences dans votre profil.
      </p>
    </div>
  `;
}
