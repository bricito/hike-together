// OneSignal temporairement désactivé
export async function initOneSignal() {}
export async function setOneSignalUser(_userId: string) {}
export async function requestNotificationPermission() {}
export async function areNotificationsEnabled() { return false; }
export async function sendPushNotification(_params: {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
}) {}
