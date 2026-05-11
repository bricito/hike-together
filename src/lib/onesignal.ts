import OneSignal from "react-onesignal";

// Initialisation OneSignal côté client
export async function initOneSignal() {
  if (typeof window === "undefined") return;

  await OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,

    allowLocalhostAsSecureOrigin: true,

    notifyButton: {
      enable: false,
    },
  });
}

// Lie l'utilisateur Supabase à OneSignal
export async function setOneSignalUser(userId: string) {
  if (typeof window === "undefined") return;

  try {
    await OneSignal.login(userId);
  } catch (error) {
    console.error("Erreur OneSignal login:", error);
  }
}

// Demande permission notifications
export async function requestNotificationPermission() {
  if (typeof window === "undefined") return;

  try {
    const permission =
      await OneSignal.Notifications.requestPermission();

    return permission;
  } catch (error) {
    console.error(
      "Erreur permission notifications:",
      error
    );
  }
}

// Vérifie si les notifications sont activées
export async function areNotificationsEnabled() {
  if (typeof window === "undefined") return false;

  return OneSignal.Notifications.permission;
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
  try {
    const response = await fetch(
      "https://api.onesignal.com/notifications",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Basic ${import.meta.env.VITE_ONESIGNAL_API_KEY}`,
        },

        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,

          include_aliases: {
            external_id: userIds,
          },

          target_channel: "push",

          headings: {
            en: title,
            fr: title,
          },

          contents: {
            en: message,
            fr: message,
          },

          url:
            url ??
            "https://www.blablahike.eu/notifications",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur OneSignal:", data);
    }

    return data;
  } catch (error) {
    console.error(
      "Erreur envoi notification:",
      error
    );
  }
}
