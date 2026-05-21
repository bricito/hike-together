import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend";

// -----------------------------------
// Initialisation
// -----------------------------------

const resend = new Resend(
  Deno.env.get("RESEND_API_KEY")
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// -----------------------------------
// Fonction principale
// -----------------------------------

serve(async () => {
  try {
    // Heure actuelle
    const now = new Date();

    // Randonnées qui commencent dans 30 min
    const in30min = new Date(
      now.getTime() + 30 * 60 * 1000
    );

    // Fenêtre de tolérance de 5 min
    const in35min = new Date(
      now.getTime() + 35 * 60 * 1000
    );

    // -----------------------------------
    // Récupération des randonnées
    // -----------------------------------

    const { data: hikes, error } = await supabase
      .from("hikes")
      .select(`
        id,
        title,
        starts_at,
        organizer_id
      `)
      .eq("reminder_sent", false)
      .gte("starts_at", in30min.toISOString())
      .lte("starts_at", in35min.toISOString());

    if (error) {
      console.error("Erreur hikes:", error);

      return new Response(
        JSON.stringify(error),
        {
          status: 500,
        }
      );
    }

    // -----------------------------------
    // Boucle randonnées
    // -----------------------------------

    for (const hike of hikes || []) {
      // -----------------------------------
      // Récupération organisateur
      // -----------------------------------

      const { data: organizer } = await supabase
        .from("profiles")
        .select("email, pseudo")
        .eq("id", hike.organizer_id)
        .single();

      if (!organizer?.email) {
        console.log(
          "Aucun email organisateur pour:",
          hike.id
        );

        continue;
      }

      // -----------------------------------
      // Liens
      // -----------------------------------

      const hikeLink = `https://blablahike.eu/hikes/${hike.id}`;

      // -----------------------------------
      // Envoi email
      // -----------------------------------

      const emailResponse =
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: organizer.email,
          subject: `Rappel avant votre randonnée`,
          html: `
            <div style="font-family:sans-serif;padding:20px;">
              
              <h2>
                Bonjour ${
                  organizer.pseudo || ""
                } 👋
              </h2>

              <p>
                Votre randonnée
                <strong>${hike.title}</strong>
                commence dans 30 minutes.
              </p>

              <p>
                Pensez à demander aux participants
                de valider leur présence via le QR code.
              </p>

              <p>
                <a 
                  href="${hikeLink}"
                  style="
                    display:inline-block;
                    padding:12px 18px;
                    background:black;
                    color:white;
                    text-decoration:none;
                    border-radius:8px;
                  "
                >
                  Voir la randonnée
                </a>
              </p>

            </div>
          `,
        });

      console.log(
        "Email envoyé:",
        emailResponse
      );

      // -----------------------------------
      // Marquer rappel envoyé
      // -----------------------------------

      await supabase
        .from("hikes")
        .update({
          reminder_sent: true,
        })
        .eq("id", hike.id);
    }

    // -----------------------------------
    // Réponse OK
    // -----------------------------------

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
      }
    );
  } catch (e) {
    console.error("Erreur globale:", e);

    return new Response(
      JSON.stringify({
        error: String(e),
      }),
      {
        status: 500,
      }
    );
  }
});
