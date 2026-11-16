import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Standalone app: never inherit the root web app's Tailwind PostCSS config.
export default defineConfig({ plugins: [react()], base: "./", css: { postcss: { plugins: [] } }, server: { host: "127.0.0.1", port: 5173, strictPort: true } });
