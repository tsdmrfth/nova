import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  plugins: [
    {
      name: "stub-css",
      load(id) {
        if (id.endsWith(".css")) {
          return "export default {}";
        }
      },
    },
  ],
  test: {
    include: [
      "packages/**/*.test.ts",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
    ],
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    setupFiles: ["apps/web/src/test/setup.ts"],
  },
});
