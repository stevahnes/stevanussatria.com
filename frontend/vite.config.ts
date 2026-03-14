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
    environment: "happy-dom",
    include: [
      "docs/.vitepress/**/__tests__/**/*.test.ts",
      "docs/components/__tests__/**/*.test.ts",
    ],
    setupFiles: ["docs/.vitepress/theme/components/__tests__/setup.ts"],
    globals: true,
  },
});
