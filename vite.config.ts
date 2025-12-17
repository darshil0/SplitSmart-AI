import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    // Production-ready server config
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: {
        host: "localhost",
      },
    },
    
    // Optimized preview server
    preview: {
      port: 3001,
      host: "0.0.0.0",
    },

    plugins: [
      react({
        // Fast Refresh optimizations
        fastRefresh: true,
      }),
      
      // PWA Support (matches HTML manifest)
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

    // Path aliases for clean imports
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@services": path.resolve(__dirname, "src/services"),
        "@types": path.resolve(__dirname, "src/types"),
      },
    },

    // Production optimizations
    build: {
      sourcemap: true, // Keep for debugging
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            vendor: ["react", "react-dom", "lucide-react"],
            charts: ["recharts"],
            gemini: ["@google/generative-ai"],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Allow larger chunks for charts
    },

    // ESM/CDN optimizations (for HTML file deployment)
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@google/generative-ai",
        "lucide-react",
        "recharts",
      ],
    },

    // Tailwind CSS config
    css: {
      postcss: {
        plugins: [
          require("tailwindcss/nesting"),
          require("tailwindcss"),
          require("autoprefixer"),
        ],
      },
    },

    // Environment variable prefix validation
    envPrefix: "VITE_",

    // Development enhancements
    define: {
      __APP_VERSION__: JSON.stringify("1.2.0"),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  };
});
