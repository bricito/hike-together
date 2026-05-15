import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",

        manifest: {
          name: "Mon App",
          short_name: "MonApp",
          description: "Application mobile",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          start_url: "/",

          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
  },
});
