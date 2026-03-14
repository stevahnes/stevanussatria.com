import type { Config } from "tailwindcss";

export default {
  content: ["./docs/**/*.{vue,js,ts,jsx,tsx,md}", "./docs/.vitepress/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {},
  plugins: [],
  files: ["tailwind.config.ts", "vite.config.ts"],
  extends: ["plugin:@typescript-eslint/disable-type-checked"],
} satisfies Config;
