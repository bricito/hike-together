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
  "/firebase-messaging-sw.js": {
    content: `importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
firebase.initializeApp({apiKey:"AIzaSyASXPKgPPWiIDaF5p3IVpcKOQeC8_rjXVo",authDomain:"blablahike-f0c03.firebaseapp.com",projectId:"blablahike-f0c03",storageBucket:"blablahike-f0c03.firebasestorage.app",messagingSenderId:"554311713842",appId:"1:554311713842:web:9790446a8c18d80a44e82b"});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "BlablaHike", { body: body ?? "", icon: icon ?? "/icon-192.png", badge: "/icon-192.png" });
});`,
    contentType: "application/javascript",
  },
  "/robots.txt": {
    content: `User-agent: *\nAllow: /\nDisallow: /me\nDisallow: /messages\nDisallow: /notifications\nDisallow: /my-hikes\nDisallow: /create\nDisallow: /checkin\nDisallow: /super-admin-8472\nDisallow: /reset-password\n\nSitemap: https://blablahike.eu/sitemap.xml`,
    contentType: "text/plain",
  },
};

// ─── Handlers Stripe ────────────────────────────────────────────────────────

async function handleCreateCheckout(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json() as {
      hikeId: string;
      hikeTitle: string;
      priceCents: number;
      currency: string;
      userId: string;
      userEmail: string;
    };

    if (!body.priceCents || body.priceCents < 50) {
      return Response.json({ error: "Prix invalide" }, { status: 400 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Upsert participation en pending
    await supabase
      .from("hike_participants")
      .upsert(
        {
          hike_id: body.hikeId,
          user_id: body.userId,
          status: "pending",
          payment_status: "pending",
        },
        { onConflict: "hike_id,user_id", ignoreDuplicates: true },
      );

    // Créer la session Stripe
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[0]": "card",
        customer_email: body.userEmail,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": body.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(body.priceCents),
        "line_items[0][price_data][product_data][name]": `Participation — ${body.hikeTitle}`,
        "line_items[0][price_data][product_data][description]": "Partage des frais de randonnée",
        "metadata[hikeId]": body.hikeId,
        "metadata[userId]": body.userId,
        "payment_intent_data[metadata][hikeId]": body.hikeId,
        "payment_intent_data[metadata][userId]": body.userId,
        success_url: `${env.PUBLIC_BASE_URL}/hikes/${body.hikeId}?payment=success`,
        cancel_url: `${env.PUBLIC_BASE_URL}/hikes/${body.hikeId}?payment=cancelled`,
      }),
    });

    const session = await stripeRes.json() as { url: string; id: string; error?: { message: string } };

    if (!stripeRes.ok) {
      return Response.json({ error: session.error?.message ?? "Erreur Stripe" }, { status: 500 });
    }

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleStripeWebhook(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    const secret = env.STRIPE_WEBHOOK_SECRET;

    // Vérification signature Stripe (HMAC-SHA256)
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

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata as { hikeId: string; userId: string };
      await supabase
        .from("hike_participants")
        .update({
          status: "accepted",
          payment_status: "paid",
          stripe_checkout_session_id: session.id as string,
          stripe_payment_intent_id: session.payment_intent as string,
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

    // Routes API Stripe — interceptées avant TanStack Router
    const e = env as Record<string, string>;
    if (url.pathname === "/api/create-checkout") {
      return handleCreateCheckout(request, e);
    }
    if (url.pathname === "/api/stripe-webhook") {
      return handleStripeWebhook(request, e);
    }

    // Fichiers statiques
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
};
