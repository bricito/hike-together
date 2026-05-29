import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const onRequestPost: PagesFunction<{
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}> = async ({ request, env }) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Webhook signature invalide", { status: 400 });
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ✅ Paiement confirmé → on accepte la participation
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const { hikeId, userId } = session.metadata ?? {};

    await supabase
      .from("participations")
      .update({
        status: "accepted",              // 👈 passage de pending → accepted
        payment_status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("hike_id", hikeId)
      .eq("user_id", userId)
      .eq("status", "pending");         // 👈 sécurité : on ne touche qu'aux pending
  }

  // 💸 Remboursement → on repasse en cancelled
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = charge.payment_intent as string;

    await supabase
      .from("participations")
      .update({
        status: "pending",              // 👈 ou "cancelled" selon ta logique métier
        payment_status: "refunded",
      })
      .eq("stripe_payment_intent_id", paymentIntentId);
  }

  return new Response("ok");
};
