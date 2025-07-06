import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          filename: "dist/stats.html",
          open: true, // Automatically opens the file in browser
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    },
  },
});
