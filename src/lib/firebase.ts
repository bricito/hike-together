export async function requestFCMToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    if (typeof Notification === "undefined") return null;

    const permission = await Notification.requestPermission();
    toast.info(`Permission: ${permission}`); // DEBUG

    if (permission !== "granted") {
      console.warn("Permission notification non accordée:", permission);
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Notifications non supportées sur ce device");
      return null;
    }

    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    toast.info(`Token généré: ${token ? "oui" : "non"}`); // DEBUG

    if (!token) {
      console.warn("getToken() n'a renvoyé aucun token");
      return null;
    }

    const session = await waitForValidSession();
    toast.info(`Session prête: ${session ? "oui" : "non"}`); // DEBUG

    if (!session) {
      console.warn("Token FCM généré mais session Supabase non prête après plusieurs tentatives");
      return null;
    }

    const { error: rpcError } = await supabase.rpc("save_fcm_token", {
      p_token: token,
    });

    if (rpcError) {
      console.error("Erreur save_fcm_token:", rpcError);
      toast.error(`Échec sauvegarde: ${rpcError.message}`); // DEBUG
      return null;
    }

    toast.success("Token sauvegardé !"); // DEBUG

    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    toast.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`); // DEBUG
    return null;
  }
}
