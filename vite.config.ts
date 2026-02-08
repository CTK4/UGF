import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isReplit = !!process.env.REPL_ID || !!process.env.REPLIT_DEPLOYMENT || !!process.env.REPLIT_ENV;
const runtimePort = Number(process.env.PORT) || 3000;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "UGF Coach RPG",
        short_name: "UGF Coach",
        description: "UGF Coach RPG Prototype",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,txt}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: runtimePort,
    // In Replit, port 3000 might already be taken; don't crash.
    strictPort: false,
    // Replit uses dynamic *.replit.dev (and sometimes *.riker.replit.dev) hosts.
    // Allow all hosts to prevent "Blocked request".
    allowedHosts: true,
    // HMR can be finicky behind Replit's proxy; this improves reliability.
    hmr: isReplit
      ? {
          protocol: "wss",
          clientPort: 443,
        }
      : undefined,
  },
});
