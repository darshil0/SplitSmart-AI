import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "tailwindcss";
import tailwindcssNesting from "tailwindcss/nesting/index.js";
import autoprefixer from "autoprefixer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  // Suppress unused variable warning; env is available for future VITE_ lookups
  void env;

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: {
        host: "localhost",
      },
    },

    preview: {
      port: 3001,
      host: "0.0.0.0",
    },

    plugins: [
      react({
        fastRefresh: true,
      }),

      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
        manifest: {
          name: "SplitSmart AI",
          short_name: "splitsmart",
          description: "AI-powered bill splitting with Gemini 1.5 Pro",
          theme_color: "#4f46e5",
          icons: [
            {
              src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjNGY0NmU1Ii8+PHBhdGggZD0iTTMwIDMwIEw3MCA3MCBNNzAgMzAgTDMwIDcwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
              sizes: "96x96",
              type: "image/svg+xml",
            },
            {
              src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNGY0NmU1IiByeD0iOCIvPjxwYXRoIGQ9Ik0xMCAxMCBMMTggMjggTTE4IDEwIEwxMCAyOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
              sizes: "32x32",
              type: "image/svg+xml",
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "lucide-react"],
            charts: ["recharts"],
            gemini: ["@google/generative-ai"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@google/generative-ai",
        "lucide-react",
        "recharts",
      ],
    },

    css: {
      postcss: {
        plugins: [tailwindcssNesting, tailwindcss, autoprefixer],
      },
    },

    envPrefix: "VITE_",

    define: {
      // FIX: version string updated to match package.json v1.3.0
      __APP_VERSION__: JSON.stringify("1.3.0"),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  };
});
