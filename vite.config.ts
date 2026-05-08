import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const version = process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? "0.1.0";
const commit = process.env.VITE_COMMIT_SHA ?? "local";

export default defineConfig({
  base: "/instant-cast/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_SHA__: JSON.stringify(commit),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@huggingface/transformers")) return "whisper";
          if (id.includes("@ffmpeg")) return "ffmpeg";
          if (id.includes("@mediapipe")) return "mediapipe";
          if (id.includes("age-encryption") || id.includes("@noble")) return "age";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["node_modules/**", "dist/**", "docs/**", "test/e2e/**"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
