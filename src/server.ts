import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }
  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }
  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const STATIC_FILES: Record<string, { content: string; contentType: string }> = {
  "/robots.txt": {
    content: `User-agent: *\nAllow: /\nDisallow: /me\nDisallow: /messages\nDisallow: /notifications\nDisallow: /my-hikes\nDisallow: /create\nDisallow: /checkin\nDisallow: /super-admin-8472\nDisallow: /reset-password\n\nSitemap: https://blablahike.eu/sitemap.xml`,
    contentType: "text/plain",
  },
};

// Nombre de jours après la date de la rando avant transfert automatique
// (délai de sécurité pour laisser le temps aux litiges/annulations de remonter)
const PAYOUT_DELAY_DAYS = 3;

// ─── Helpers Stripe ─────────────────────────────────────────────────────────

function stripeHeaders(env: Record<string, string>) {
  return {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function getSupabase(env: Record<string, string>) {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ─── Handlers Stripe — paiement participant ────────────────────────────────

async function handleCreateCheckout(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json() as {
      hikeId: string;
      hikeSlug: string;
      hikeTitle: string;
      priceCents: number;
      currency: string;
      userId: string;
      userEmail: string;
    };

    if (!body.priceCents || body.priceCents < 50) {
      return Response.json({ error: "Prix invalide" }, { status: 400 });
    }

    const totalCents = Math.ceil((body.priceCents + 25) / 0.885);

    const supabase = await getSupabase(env);

    await supabase
      .from("hike_participants")
      .upsert(
        {
          hike_id: body.hikeId,
          user_id: body.userId,
          status: "pending",
          payment_status: "pending",
          price_cents_net: body.priceCents,
          payout_status: "pending",
        },
        { onConflict: "hike_id,user_id", ignoreDuplicates: true },
      );

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: stripeHeaders(env),
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[0]": "card",
        customer_email: body.userEmail,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": body.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(totalCents),
        "line_items[0][price_data][product_data][name]": `Participation — ${body.hikeTitle}`,
        "line_items[0][price_data][product_data][description]": "Participation à la randonnée — frais de service inclus",
        "metadata[hikeId]": body.hikeId,
        "metadata[userId]": body.userId,
        "metadata[priceCentsNet]": String(body.priceCents),
        "payment_intent_data[metadata][hikeId]": body.hikeId,
        "payment_intent_data[metadata][userId]": body.userId,
        "payment_intent_data[metadata][priceCentsNet]": String(body.priceCents),
        success_url: `${env.PUBLIC_BASE_URL}/hikes/${body.hikeSlug}?payment=success`,
        cancel_url: `${env.PUBLIC_BASE_URL}/hikes/${body.hikeSlug}?payment=cancelled`,
      }),
    });

    const session = await stripeRes.json() as { url: string; id: string; error?: { message: string } };

    if (!stripeRes.ok) {
      return Response.json({ error: session.error?.message ?? "Erreur Stripe" }, { status: 500 });
    }

    return Response.json({ url: session.url, sessionId: session.id, totalCents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleRefund(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json() as { participationId: string };

    const supabase = await getSupabase(env);

    const { data, error } = await supabase
      .from("hike_participants")
      .select("stripe_payment_intent_id, payment_status, payout_status, user_id")
      .eq("id", body.participationId)
      .single();

    if (error || !data) {
      return Response.json({ error: "Participation introuvable" }, { status: 404 });
    }

    if (data.payment_status !== "paid") {
      return Response.json({ error: "Aucun paiement à rembourser" }, { status: 400 });
    }

    if (data.payout_status === "transferred") {
      return Response.json({ error: "Fonds déjà transférés à l'organisateur, remboursement impossible depuis cet endpoint" }, { status: 400 });
    }

    if (!data.stripe_payment_intent_id) {
      return Response.json({ error: "Payment intent manquant" }, { status: 400 });
    }

    const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: stripeHeaders(env),
      body: new URLSearchParams({
        payment_intent: data.stripe_payment_intent_id,
      }),
    });

    const refund = await refundRes.json() as { id: string; error?: { message: string } };

    if (!refundRes.ok) {
      return Response.json({ error: refund.error?.message ?? "Erreur Stripe remboursement" }, { status: 500 });
    }

    await supabase
      .from("hike_participants")
      .update({
        payment_status: "refunded",
        status: "cancelled",
      })
      .eq("id", body.participationId);

    return Response.json({ ok: true, refundId: refund.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("Refund error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// ─── Handlers Stripe Connect — organisateur ────────────────────────────────

async function handleConnectOnboard(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json() as { userId: string; email: string };
    const supabase = await getSupabase(env);

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", body.userId)
      .single();

    let accountId = profile?.stripe_connect_account_id as string | undefined;

    if (!accountId) {
      const accountRes = await fetch("https://api.stripe.com/v1/accounts", {
        method: "POST",
        headers: stripeHeaders(env),
        body: new URLSearchParams({
          type: "express",
          email: body.email,
          "capabilities[card_payments][requested]": "true",
          "capabilities[transfers][requested]": "true",
          "metadata[userId]": body.userId,
        }),
      });

      const account = await accountRes.json() as { id: string; error?: { message: string } };

      if (!accountRes.ok) {
        return Response.json({ error: account.error?.message ?? "Erreur création compte Stripe" }, { status: 500 });
      }

      accountId = account.id;

      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", body.userId);
    }

    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: stripeHeaders(env),
      body: new URLSearchParams({
        account: accountId,
        refresh_url: `${env.PUBLIC_BASE_URL}/me/payments?refresh=true`,
        return_url: `${env.PUBLIC_BASE_URL}/me/payments?onboarding=success`,
        type: "account_onboarding",
      }),
    });

    const link = await linkRes.json() as { url: string; error?: { message: string } };

    if (!linkRes.ok) {
      return Response.json({ error: link.error?.message ?? "Erreur génération lien onboarding" }, { status: 500 });
    }

    return Response.json({ url: link.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleConnectStatus(request: Request, env: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId manquant" }, { status: 400 });
  }

  try {
    const supabase = await getSupabase(env);

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return Response.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const accountRes = await fetch(`https://api.stripe.com/v1/accounts/${profile.stripe_connect_account_id}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });

    const account = await accountRes.json() as {
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
      error?: { message: string };
    };

    if (!accountRes.ok) {
      return Response.json({ error: account.error?.message ?? "Erreur Stripe" }, { status: 500 });
    }

    await supabase
      .from("profiles")
      .update({
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
      })
      .eq("id", userId);

    return Response.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return Response.json({ error: message }, { status: 500 });
  }
}

// ─── Logique de payout réutilisable (appel manuel + cron) ──────────────────

type PayoutResult =
  | { ok: true; hikeId: string; transferId: string; amountCents: number }
  | { ok: false; hikeId: string; error: string };

async function runHikePayout(
  hikeId: string,
  env: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<PayoutResult> {
  const { data: hike, error: hikeError } = await supabase
    .from("hikes")
    .select("id, organizer_id, payout_status")
    .eq("id", hikeId)
    .neq("status", "cancelled")
    .single();

  if (hikeError || !hike) {
    return { ok: false, hikeId, error: "Rando introuvable" };
  }

  if (hike.payout_status === "transferred") {
    return { ok: false, hikeId, error: "Fonds déjà transférés" };
  }

  const { data: organizerProfile } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_payouts_enabled")
    .eq("id", hike.organizer_id)
    .single();

  if (!organizerProfile?.stripe_connect_account_id) {
    return { ok: false, hikeId, error: "Organisateur sans compte de paiement configuré" };
  }

  if (!organizerProfile.stripe_connect_payouts_enabled) {
    return { ok: false, hikeId, error: "Compte organisateur non encore vérifié par Stripe" };
  }

  const { data: participants, error: participantsError } = await supabase
    .from("hike_participants")
    .select("id, price_cents_net")
    .eq("hike_id", hikeId)
    .eq("payment_status", "paid")
    .eq("payout_status", "pending");

  if (participantsError) {
    return { ok: false, hikeId, error: "Erreur lecture participants" };
  }

  const amountCents = (participants ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, p: any) => sum + (p.price_cents_net ?? 0),
    0,
  );

  if (amountCents <= 0) {
    // Rien à transférer (ex: rando sans participants payants) — on marque quand même
    // comme traité pour ne pas la re-scanner à chaque cron
    await supabase.from("hikes").update({ payout_status: "transferred" }).eq("id", hikeId);
    return { ok: false, hikeId, error: "Rien à transférer" };
  }

  const transferRes = await fetch("https://api.stripe.com/v1/transfers", {
    method: "POST",
    headers: stripeHeaders(env),
    body: new URLSearchParams({
      amount: String(amountCents),
      currency: "eur",
      destination: organizerProfile.stripe_connect_account_id,
      "metadata[hikeId]": hikeId,
    }),
  });

  const transfer = await transferRes.json() as { id: string; error?: { message: string } };

  if (!transferRes.ok) {
    return { ok: false, hikeId, error: transfer.error?.message ?? "Erreur Stripe transfer" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participantIds = (participants ?? []).map((p: any) => p.id);

  await supabase
    .from("hike_participants")
    .update({ payout_status: "transferred" })
    .in("id", participantIds);

  await supabase
    .from("hikes")
    .update({ payout_status: "transferred", stripe_transfer_id: transfer.id })
    .eq("id", hikeId);

  return { ok: true, hikeId, transferId: transfer.id, amountCents };
}

async function handleHikePayout(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json() as { hikeId: string };
    const supabase = await getSupabase(env);
    const result = await runHikePayout(body.hikeId, env, supabase);

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ ok: true, transferId: result.transferId, amountCents: result.amountCents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("Payout error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// ─── Cron : scan des randos passées et transfert automatique ──────────────

async function runScheduledPayouts(env: Record<string, string>): Promise<void> {
  const supabase = await getSupabase(env);

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - PAYOUT_DELAY_DAYS);

  // Adapte le nom de colonne "date" si ta table hikes utilise un autre champ
  // (ex: "hike_date", "start_date"...). Adapte aussi le filtre "status" si tu as
  // une colonne d'état de rando pour exclure les randos annulées.
  const { data: hikes, error } = await supabase
    .from("hikes")
    .select("id")
    .eq("payout_status", "pending")
    .lte("starts_at", threshold.toISOString());

  if (error) {
    console.error("Cron payout: erreur lecture hikes", error.message);
    return;
  }

  if (!hikes || hikes.length === 0) {
    console.log("Cron payout: aucune rando à traiter");
    return;
  }

  console.log(`Cron payout: ${hikes.length} rando(s) à traiter`);

  for (const hike of hikes) {
    try {
      const result = await runHikePayout(hike.id as string, env, supabase);
      if (result.ok) {
        console.log(`Cron payout: transfert ${result.transferId} de ${result.amountCents} centimes pour la rando ${hike.id}`);
      } else {
        console.warn(`Cron payout: rando ${hike.id} non traitée — ${result.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`Cron payout: erreur sur la rando ${hike.id}`, message);
    }
  }
}

// ─── Webhook Stripe (paiements + Connect) ──────────────────────────────────

async function handleStripeWebhook(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    const secret = env.STRIPE_WEBHOOK_SECRET;

    const encoder = new TextEncoder();
    const parts = signature.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    if (!tPart || !v1Part) {
      return new Response("Signature invalide", { status: 400 });
    }
    const timestamp = tPart.slice(2);
    const expectedSig = v1Part.slice(3);
    const signedPayload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSig !== expectedSig) {
      return new Response("Signature invalide", { status: 400 });
    }

    const event = JSON.parse(body) as {
      type: string;
      data: { object: Record<string, unknown> };
    };

    const supabase = await getSupabase(env);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata as { hikeId: string; userId: string; priceCentsNet?: string };
      await supabase
        .from("hike_participants")
        .update({
          status: "accepted",
          payment_status: "paid",
          stripe_checkout_session_id: session.id as string,
          stripe_payment_intent_id: session.payment_intent as string,
          ...(metadata.priceCentsNet ? { price_cents_net: Number(metadata.priceCentsNet) } : {}),
        })
        .eq("hike_id", metadata.hikeId)
        .eq("user_id", metadata.userId)
        .eq("status", "pending");
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      await supabase
        .from("hike_participants")
        .update({ status: "pending", payment_status: "refunded" })
        .eq("stripe_payment_intent_id", charge.payment_intent as string);
    }

    if (event.type === "account.updated") {
      const account = event.data.object as {
        id: string;
        charges_enabled: boolean;
        payouts_enabled: boolean;
      };
      await supabase
        .from("profiles")
        .update({
          stripe_connect_charges_enabled: account.charges_enabled,
          stripe_connect_payouts_enabled: account.payouts_enabled,
        })
        .eq("stripe_connect_account_id", account.id);
    }

    return new Response("ok");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("Webhook error:", message);
    return new Response("Erreur interne", { status: 500 });
  }
}

// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const e = env as Record<string, string>;

    if (url.pathname === "/api/create-checkout") {
      return handleCreateCheckout(request, e);
    }
    if (url.pathname === "/api/stripe-webhook") {
      return handleStripeWebhook(request, e);
    }
    if (url.pathname === "/api/refund") {
      return handleRefund(request, e);
    }
    if (url.pathname === "/api/connect/onboard") {
      return handleConnectOnboard(request, e);
    }
    if (url.pathname === "/api/connect/status") {
      return handleConnectStatus(request, e);
    }
    if (url.pathname === "/api/payout-hike") {
      return handleHikePayout(request, e);
    }

    const staticFile = STATIC_FILES[url.pathname];
    if (staticFile) {
      return new Response(staticFile.content, {
        status: 200,
        headers: {
          "content-type": staticFile.contentType,
          "cache-control": "public, max-age=3600",
        },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },

  // Déclenché par le Cron Trigger configuré dans wrangler.jsonc
  async scheduled(_event: unknown, env: unknown, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    const e = env as Record<string, string>;
    ctx.waitUntil(runScheduledPayouts(e));
  },
};
