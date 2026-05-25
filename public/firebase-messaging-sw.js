importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyASXPKgPPWiIDaF5p3IVpcKOQeC8_rjXVo",
  authDomain: "blablahike-f0c03.firebaseapp.com",
  projectId: "blablahike-f0c03",
  storageBucket: "blablahike-f0c03.firebasestorage.app",
  messagingSenderId: "554311713842",
  appId: "1:554311713842:web:9790446a8c18d80a44e82b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "BlablaHike", {
    body: body ?? "",
    icon: icon ?? "/icon-192.png",
    badge: "/icon-192.png",
  });
});
