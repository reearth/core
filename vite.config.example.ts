import { readFileSync } from "fs";
import path, { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";
import tsconfigPaths from "vite-tsconfig-paths";

const cesiumPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, "node_modules", "cesium", "package.json"), "utf-8"),
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    cesium({ cesiumBaseUrl: `cesium-${cesiumPackageJson.version}/` }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./example"),
    },
  },
  envPrefix: "EXAMPLE_",
  server: {
    port: 3000,
    proxy: {
      // Proxy terrain requests to avoid CORS in dev — terrain.reearth.land
      // does not send Access-Control-Allow-Origin headers.
      "/terrain-proxy": {
        target: "https://terrain.reearth.land",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/terrain-proxy/, ""),
      },
    },
  },
});
