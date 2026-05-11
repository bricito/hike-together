// Initialisation OneSignal côté client
export async function initOneSignal() {
  if (typeof window === "undefined") return;
  const OneSignal = (await import("onesignal-cordova-plugin")).default;
  // On utilise le SDK web via CDN
}

export async function initOneSignalWeb() {
  if (typeof window === "undefined") return;
  await (window as any).OneSignalDeferred?.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: "1d13442a-efc5-4421-80fe-e5126dd27818",
      safari_web_id: "",
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}

// Lie l'utilisateur Supabase à OneSignal
export async function setOneSignalUser(userId: string) {
  if (typeof window === "undefined") return;
  (window as any).OneSignalDeferred?.push((OneSignal: any) => {
    OneSignal.login(userId);
  });
}

// Envoie une notification push via l'API REST OneSignal
export async function sendPushNotification({
  userIds,
  title,
  message,
  url,
}: {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
}) {
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${import.meta.env.VITE_ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
      include_aliases: { external_id: userIds },
      target_channel: "push",
      headings: { en: title, fr: title },
      contents: { en: message, fr: message },
      url: url ?? "https://www.blablahike.eu/notifications",
    }),
  });
}
