import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  try {
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in35min = new Date(now.getTime() + 35 * 60 * 1000);

    // Randonnées qui commencent dans ~30 minutes
    const { data: hikes, error } = await supabase
      .from("hikes")
      .select("id, title, slug, starts_at, organizer_id")
      .gte("starts_at", in30min.toISOString())
      .lte("starts_at", in35min.toISOString())
      .in("status", ["open", "full"]);

    if (error) {
      console.error(error);
      return new Response(JSON.stringify(error), { status: 500 });
    }

    for (const hike of hikes ?? []) {

      // Vérifie qu'un checkin n'a pas déjà été créé récemment (anti-doublon)
      const { data: existing } = await supabase
        .from("hike_checkins")
        .select("id")
        .eq("hike_id", hike.id)
        .gte("created_at", new Date(now.getTime() - 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existing) continue;

      // Génère le token de check-in
      const token = crypto.randomUUID();
      const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000); // valable 4h

      await supabase.from("hike_checkins").insert({
        hike_id: hike.id,
        token,
        expires_at: expires.toISOString(),
      });

      // Email de l'organisateur
      const { data: authUser } = await supabase.auth.admin.getUserById(hike.organizer_id);
      const email = authUser?.user?.email;
      if (!email) continue;

      // Profil organisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", hike.organizer_id)
        .single();

      const checkinUrl = `https://blablahike.eu/checkin?token=${token}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}`;
      const hikeUrl = `https://blablahike.eu/hikes/${hike.slug}`;

      const startTime = new Date(hike.starts_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BlablaHike <noreply@blablahike.eu>",
          to: email,
          subject: `⏰ Rappel — ${hike.title} commence dans 30 min`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
              <h2 style="color:#16a34a;margin-bottom:8px">Votre randonnée commence bientôt !</h2>
              <p style="color:#374151">Bonjour ${profile?.full_name ?? ""} 👋</p>
              <p style="color:#374151">
                <strong>${hike.title}</strong> commence à <strong>${startTime}</strong>, dans environ 30 minutes.
              </p>
              <p style="color:#374151">
                Montrez ce QR code à vos participants pour valider leur présence :
              </p>
              <div style="text-align:center;margin:32px 0;background:white;padding:24px;border-radius:12px;border:1px solid #e5e7eb">
                <img src="${qrUrl}" width="250" style="border-radius:8px" />
                <p style="font-size:12px;color:#9ca3af;margin-top:12px">
                  Valable jusqu'à ${expires.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                </p>
              </div>
              <p style="color:#6b7280;font-size:13px">
                Si l'image ne s'affiche pas, partagez ce lien aux participants :<br/>
                <a href="${checkinUrl}" style="color:#16a34a">${checkinUrl}</a>
              </p>
              <div style="margin-top:24px">
                <a href="${hikeUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
                  Voir la randonnée →
                </a>
              </div>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, count: hikes?.length ?? 0 }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
