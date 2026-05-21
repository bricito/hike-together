import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  try {
    const now = new Date();

    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in35min = new Date(now.getTime() + 35 * 60 * 1000);

    // -----------------------------------
    // Récupération des randonnées
    // -----------------------------------

    const { data: hikes, error } = await supabase
      .from("hikes")
      .select(`
        id,
        title,
        starts_at,
        organizer_id,
        checkin_token
      `)
      .eq("reminder_sent", false)
      .gte("starts_at", in30min.toISOString())
      .lte("starts_at", in35min.toISOString());

    if (error) {
      console.error(error);
      return new Response(JSON.stringify(error), { status: 500 });
    }

    for (const hike of hikes || []) {

      // -----------------------------------
      // Récup organisateur (EMAIL via AUTH)
      // -----------------------------------

      const { data: userData } =
        await supabase.auth.admin.getUserById(hike.organizer_id);

      const email = userData?.user?.email;

      if (!email) continue;

      // -----------------------------------
      // Lien randonnée + QR code
      // -----------------------------------

      const hikeLink = `https://blablahike.eu/hikes/${hike.id}`;

      const qrCodeUrl = `https://blablahike.eu/api/qrcode?token=${hike.checkin_token}`;

      // -----------------------------------
      // Anti-doublon simple
      // -----------------------------------

      const { data: alreadySent } = await supabase
        .from("hikes")
        .select("reminder_sent")
        .eq("id", hike.id)
        .single();

      if (alreadySent?.reminder_sent) continue;

      // -----------------------------------
      // EMAIL
      // -----------------------------------

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "⏰ Rappel randonnée - check-in participants",
        html: `
          <div style="font-family: Arial; padding: 20px;">

            <h2>⏰ Ta randonnée commence bientôt</h2>

            <p>
              <strong>${hike.title}</strong> commence dans environ 30 minutes.
            </p>

            <p>
              👉 Pense à demander aux participants de scanner leur QR code pour valider leur présence.
            </p>

            <p>
              <a href="${hikeLink}">
                Voir la randonnée
              </a>
            </p>

            <hr />

            <h3>📱 QR Code de check-in</h3>

            <p>Les participants doivent scanner ce QR :</p>

            <img 
              src="${qrCodeUrl}" 
              width="200" 
              style="border-radius:12px;"
            />

            <p style="font-size:12px;color:#666;">
              Si l’image ne s’affiche pas, partage ce lien :
              <br/>
              ${qrCodeUrl}
            </p>

          </div>
        `,
      });

      // -----------------------------------
      // Marquer comme envoyé
      // -----------------------------------

      await supabase
        .from("hikes")
        .update({
          reminder_sent: true,
        })
        .eq("id", hike.id);
    }

    return new Response(JSON.stringify({ success: true }));

  } catch (e) {
    console.error(e);

    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
    });
  }
});
