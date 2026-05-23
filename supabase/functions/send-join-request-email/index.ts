import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { hike_id, requester_id } = await req.json();

    // Récupère la randonnée + organisateur
    const { data: hike } = await supabase
      .from("hikes")
      .select("title, slug, organizer_id")
      .eq("id", hike_id)
      .single();

    if (!hike) return new Response("Hike not found", { status: 404 });

    // Email de l'organisateur
    const { data: authUser } = await supabase.auth.admin.getUserById(hike.organizer_id);
    const organizerEmail = authUser?.user?.email;
    if (!organizerEmail) return new Response("No email", { status: 400 });

    // Profil du demandeur
    const { data: requester } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", requester_id)
      .single();

    const requesterName = requester?.full_name ?? "Quelqu'un";
    const hikeUrl = `https://blablahike.eu/hikes/${hike.slug}`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BlablaHike <noreply@blablahike.eu>",
        to: organizerEmail,
        subject: `🥾 Nouvelle demande — ${hike.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
            <h2 style="color:#16a34a;margin-bottom:8px">Nouvelle demande de participation</h2>
            <p style="color:#374151"><strong>${requesterName}</strong> souhaite rejoindre votre randonnée :</p>
            <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e7eb">
              <p style="font-size:18px;font-weight:bold;color:#111827;margin:0">${hike.title}</p>
            </div>
            <a href="${hikeUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
              Voir la demande →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              Vous pouvez accepter ou refuser directement depuis la page de la randonnée.
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
