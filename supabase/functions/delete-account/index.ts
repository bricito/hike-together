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

    // Supprime les données applicatives liées à l'utilisateur
    await supabaseAdmin.from("hikes").delete().eq("user_id", user.id);
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    // ⚠️ Adapte le nom de cette table à celle qui stocke ton lien Stripe Connect
    // (probablement quelque chose comme "stripe_connect_accounts" ou "connect_accounts")
    await supabaseAdmin.from("stripe_connect_accounts").delete().eq("user_id", user.id);

    // Supprime les tokens FCM si stockés dans une table dédiée
    await supabaseAdmin.from("fcm_tokens").delete().eq("user_id", user.id);

    // Supprime l'avatar du storage
    await supabaseAdmin.storage.from("avatars").remove([`${user.id}/avatar.webp`]);

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
