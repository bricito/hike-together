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

    const { createClient } = await import("@su
