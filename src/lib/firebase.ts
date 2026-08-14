import { initializeApp, getApps } from "firebase/app";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

// Attend que la session Supabase soit pleinement établie (JWT présent), avec retry
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
  try {
    if (typeof window === "undefined") return null;
    if (typeof Notification === "undefined") return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permission notification non accordée:", permission);
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Notifications non supportées: pas de service worker sur ce device");
      return null;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      console.warn("Aucun service worker enregistré au moment de requestFCMToken()");
    }

    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      toast.error("Notifications: getToken() n'a renvoyé aucun token");
      return null;
    }

    // Attend une session pleinement établie avant d'écrire en base
    const session = await waitForValidSession();

    if (!session) {
      console.warn("Token FCM généré mais session Supabase non prête après plusieurs tentatives");
      toast.error("Notifications: session non prête, réessaie plus tard");
      return null;
    }

    // Passe par une fonction RPC (SECURITY DEFINER) qui réassigne le token
    // au user courant même s'il appartenait précédemment à un autre compte
    // (device réutilisé pour plusieurs comptes de test) — contourne le blocage
    // RLS qu'un upsert direct rencontrerait dans ce cas.
    const { error: rpcError } = await supabase.rpc("save_fcm_token", {
      p_token: token,
    });

    if (rpcError) {
      console.error("Erreur save_fcm_token:", rpcError);
      toast.error(`Notifications: échec sauvegarde token (${rpcError.message})`);
      return null;
    }

    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    toast.error(`Erreur notification: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function onFCMMessage(callback: (payload: any) => void) {
  if (typeof window === "undefined") return;
  const { getMessaging, onMessage } = await import("firebase/messaging");
  const messaging = getMessaging();
  onMessage(messaging, callback);
}
