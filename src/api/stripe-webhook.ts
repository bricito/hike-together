const supabase = createClient(

  env.SUPABASE_URL,

  env.SUPABASE_SERVICE_ROLE_KEY

);

// Insérer la participation en pending si elle n'existe pas déjà

const { error } = await supabase

  .from("participations")

  .upsert(

    {

      hike_id: body.hikeId,

      user_id: body.userId,

      status: "pending",

      payment_status: "pending",

    },

    { onConflict: "hike_id,user_id", ignoreDuplicates: true }

  );

if (error) {

  return Response.json({ error: "Impossible de créer la participation" }, { status: 500 });

}
