import { createAPIFileRoute } from "@tanstack/react-start/api";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getWebRequest } from "@tanstack/react-start/server";

export const APIRoute = createAPIFileRoute("/api/create-checkout")({
  POST: async () => {
    const request = getWebRequest();
    const env = process.env; // ou utilisez getEnv() selon votre setup

    const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    });

    const body = await request.json();
    const { hikeId, hikeTitle, priceCents, currency, userId, userEmail } = body;

    const supabase = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert participation en pending
    const { error } = await supabase
      .from("participations")
      .upsert(
        { hike_id: hikeId, user_id: userId, status: "pending", payment_status: "pending" },
        { onConflict: "hike_id,user_id", ignoreDuplicates: true }
      );

    if (error) {
      return Response.json({ error: "Impossible de créer la participation" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: { name: hikeTitle },
          },
          quantity: 1,
        },
      ],
      metadata: { hikeId, userId },
      success_url: `${env.PUBLIC_BASE_URL}/hikes/${hikeId}?payment=success`,
      cancel_url: `${env.PUBLIC_BASE_URL}/hikes/${hikeId}?payment=cancelled`,
    });

    return Response.json({ url: session.url });
  },
});
