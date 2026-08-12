import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Récupère le compte Stripe Connect avant de supprimer le profil
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", user.id)
      .maybeSingle();

    // Ferme le compte Stripe Connect s'il existe
    if (profile?.stripe_connect_account_id) {
      await fetch(`https://api.stripe.com/v1/accounts/${profile.stripe_connect_account_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
        },
      });
    }

    // Supprime les données applicatives liées à l'utilisateur
    await supabaseAdmin.from("participations").delete().eq("user_id", user.id);
    await supabaseAdmin.from("hikes").delete().eq("organizer_id", user.id);
    await supabaseAdmin.from("fcm_tokens").delete().eq("user_id", user.id);
    await supabaseAdmin.storage.from("avatars").remove([`${user.id}/avatar.webp`]);

    // Supprime le profil (et donc stripe_connect_account_id avec)
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    // Supprime l'utilisateur auth en dernier
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
