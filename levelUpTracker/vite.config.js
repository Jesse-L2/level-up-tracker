import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or host: '0.0.0.0'
    port: 5173,
  },
  // ... rest of your config
});
