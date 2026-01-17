// https://vitepress.dev/guide/custom-theme
import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import DefaultTheme from "vitepress/theme";
import { injectSpeedInsights } from "@vercel/speed-insights";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp() {
    if (typeof window !== "undefined") {
      injectSpeedInsights();
    }
  },
} satisfies Theme;
