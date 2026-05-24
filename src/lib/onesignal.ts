const ONESIGNAL_APP_ID = "1d13442a-efc5-4421-80fe-e5126dd27818";

export async function initOneSignal() {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  
  await loadOneSignalScript();
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      notifyButton: {
        enable: true, // ← active le bouton flottant OneSignal
      },
    });
  });
}

function loadOneSignalScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="OneSignalSDK"]')) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.Notifications.requestPermission();
  });
}

export async function setOneSignalUser(userId: string) {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.login(userId);
  });
}

export async function areNotificationsEnabled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return Notification.permission === "granted";
}

export async function sendPushNotification(params: {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
}) {
  console.warn("sendPushNotification doit être appelé côté serveur");
}

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}
