import type { StorybookConfig } from "@storybook/react-vite";
import type { InlineConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-links",
    "@chromatic-com/storybook",
    "@storybook/addon-docs"
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {
    },
  },

  async viteFinal(config: InlineConfig) {
    // Dynamically import cesium plugin
    const { default: cesium } = await import("vite-plugin-cesium");
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const { fileURLToPath } = await import("url");

    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const cesiumPackageJson = JSON.parse(
      readFileSync(resolve(__dirname, "..", "node_modules", "cesium", "package.json"), "utf-8"),
    );

    return {
      ...config,
      plugins: [
        ...(config.plugins || []).filter((p: any) => p?.name !== "vite:dts"),
        cesium({ cesiumBaseUrl: `cesium-${cesiumPackageJson.version}/` }),
      ],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // csv-parse main entry uses Node.js streams; use browser ESM build instead
          'csv-parse': 'csv-parse/browser/esm',
          // Alias nosleep.js to its dist file which has proper exports
          'nosleep.js': resolve(__dirname, '..', 'node_modules', 'nosleep.js', 'dist', 'NoSleep.js'),
        },
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        // Exclude Cesium from optimization due to worker files
        exclude: [
          ...(config.optimizeDeps?.exclude || []),
          'cesium',
        ],
        // Keep resium included
        include: [
          ...(config.optimizeDeps?.include || []),
          'resium',
        ],
      },
    };
  },
};
export default config;
