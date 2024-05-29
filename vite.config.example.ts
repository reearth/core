import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cesium from "vite-plugin-cesium";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react(), cesium()],
});
