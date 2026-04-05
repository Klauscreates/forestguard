import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxies /api/* to Vercel dev server running on 3001
      // Run: npx vercel dev --listen 3001 in a separate terminal
      // Then: npm run dev
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
