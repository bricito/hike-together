import { initializeApp, getApps } from "firebase/app";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initFirebase, requestFCMToken, onFCMMessage } from "@/lib/firebase";

const firebaseConfig = {
  apiKey: "AIzaSyASXPKgPPWiIDaF5p3IVpcKOQeC8_rjXVo",
  authDomain: "blablahike-f0c03.firebaseapp.com",
  projectId: "blablahike-f0c03",
  storageBucket: "blablahike-f0c03.firebasestorage.app",
  messagingSenderId: "554311713842",
  appId: "1:554311713842:web:9790446a8c18d80a44e82b",
  measurementId: "G-X3XSSK6SEJ",
};

const VAPID_KEY = "BHuwDJxqVdVYdsANvO92szbl8UYa_ub2KdzkbzjVwKkcu9g84IWRKYaVZPDaS0guwcD5qC3WdwWxHaWWYWvE-t0";

export function initFirebase() {
  if (typeof window === "undefined") return;
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  toast.info("0. initFirebase() OK");
}

async function waitForValidSession(maxAttempts = 5, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && session?.user) {
      return session;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

export async function requestFCMToken(): Promise<string | null> {
  toast.info("1. Début requestFCMToken()");

  try {
    if (typeof window === "undefined") {
      toast.error("1b. window undefined, on sort");
      return null;
    }
    if (typeof Notification === "undefined") {
      toast.error("1c. Notification API indisponible sur ce device");
      return null;
    }

    const permission = await Notification.requestPermission();
    toast.info(`2. Permission: ${permission}`);

    if (permission !== "granted") {
      toast.error(`2b. Permission non accordée (${permission}), on sort`);
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("3a. serviceWorker non supporté");
      return null;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    toast.info(`3. SW registrations: ${registrations.length}`);

    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging();
    toast.info("4. getMessaging() OK, appel getToken()...");

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    toast.info(`5. Token généré: ${token ? "oui (" + token.slice(0, 10) + "...)" : "non"}`);

    if (!token) {
      toast.error("5b. getToken() a renvoyé null/vide");
      return null;
    }

    const session = await waitForValidSession();
    toast.info(`6. Session prête: ${session ? "oui, user=" + session.user.id.slice(0, 8) : "non"}`);

    if (!session) {
      toast.error("6b. Session jamais prête après 5 tentatives");
      return null;
    }

    toast.info("7. Appel RPC save_fcm_token...");
    const { error: rpcError } = await supabase.rpc("save_fcm_token", {
      p_token: token,
    });

    if (rpcError) {
      toast.error(`7b. Erreur RPC: ${rpcError.message}`);
      console.error("Erreur save_fcm_token:", rpcError);
      return null;
    }

    toast.success("8. Token sauvegardé avec succès !");
    return token;
  } catch (error) {
    toast.error(`EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
    console.error("FCM token error:", error);
    return null;
  }
}

export async function onFCMMessage(callback: (payload: any) => void) {
  if (typeof window === "undefined") return;
  const { getMessaging, onMessage } = await import("firebase/messaging");
  const messaging = getMessaging();
  onMessage(messaging, callback);
}
