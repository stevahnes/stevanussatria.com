import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

const fileStub = resolve(__dirname, "docs/.vitepress/theme/components/__tests__/file-stub.ts");

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "/advocado.webp": fileStub,
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      // Modern way to 'include' files for coverage calculation
      include: ["docs/.vitepress/theme/components/**/*.{ts,vue}", "docs/components/**/*.{ts,vue}"],
    },
    environment: "happy-dom",
    include: [
      "docs/.vitepress/**/__tests__/**/*.test.ts",
      "docs/components/__tests__/**/*.test.ts",
    ],
    setupFiles: ["docs/.vitepress/theme/components/__tests__/setup.ts"],
    globals: true,
  },
});
