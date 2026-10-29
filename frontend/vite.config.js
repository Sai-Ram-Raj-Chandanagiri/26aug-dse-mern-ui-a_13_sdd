import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-server proxy forwards /api to the Express backend (Constitution: Technology & Implementation Constraints)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
