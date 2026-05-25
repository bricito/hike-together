import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    if (typeof Notification === "undefined") return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
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
