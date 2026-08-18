
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  initFirebase,
  requestFCMToken,
  onFCMMessage,
  isRunningAsInstalledApp,
} from "@/lib/firebase";
import { Bell } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p>Page introuvable</p>
        <Link to="/" className="text-green-600">
          Retour accueil
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1>Erreur</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type BannerStatus = "hidden" | "prompt" | "blocked";

function NotificationBanner() {
  const [status, setStatus] = useState<BannerStatus>("hidden");

  useEffect(() => {
    // On ne propose l'activation des notifications que dans l'app installée
    // (TWA), jamais dans un onglet Chrome classique.
    if (!isRunningAsInstalledApp()) return;

    const timer = setTimeout(() => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission === "default") setStatus("prompt");
      if (Notification.permission === "denied") setStatus("blocked");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (status === "hidden") return null;

  if (status === "blocked") {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center gap-3 md:max-w-sm md:left-auto md:right-4">
        <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
        <p className="text-sm flex-1">
          Notifications bloquées. Pour les réactiver : Chrome → Paramètres du
          site → blablahike.eu → Notifications → Autoriser.
        </p>
        <button
          className="text-xs text-muted-foreground"
          onClick={() => setStatus("hidden")}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center gap-3 md:max-w-sm md:left-auto md:right-4">
      <Bell className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm flex-1">Activez les notifications pour rester informé</p>
      <button
        className="text-xs bg-primary text-white px-3 py-1.5 rounded-full font-medium whitespace-nowrap"
        onClick={async () => {
          const token = await requestFCMToken();
          if (token) {
            console.log("FCM token:", token);
          }
          setStatus("hidden");
        }}
      >
        Activer
      </button>
      <button
        className="text-xs text-muted-foreground"
        onClick={() => setStatus("hidden")}
      >
        ✕
      </button>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BlaBlaHike — Randonnées entre passionnés" },
      { name: "description", content: "Trouvez et rejoignez des randonnées près de chez vous. BlablaHike connecte les randonneurs pour des sorties conviviales et funs !" },
      { name: "theme-color", content: "#16a34a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "BlaBlaHike" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    initFirebase();

    // Si permission déjà accordée ET qu'on est dans l'app installée,
    // sauvegarde le token automatiquement.
    const saveTokenIfGranted = async () => {
      if (
        isRunningAsInstalledApp() &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        await requestFCMToken();
      }
    };

    saveTokenIfGranted();
  }, []);

  // Affiche un toast quand une notif arrive alors que l'app est ouverte (foreground)
  useEffect(() => {
    onFCMMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      toast(title ?? "BlablaHike", {
        description: body ?? "",
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
        <NotificationBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
