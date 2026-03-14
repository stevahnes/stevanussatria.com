import { vi } from "vitest";
import { ref, defineComponent, h } from "vue";
import { config } from "@vue/test-utils";

vi.mock("vitepress", () => ({
  useData: () => ({
    isDark: ref(false),
    page: ref({ relativePath: "" }),
    frontmatter: ref({}),
    site: ref({}),
    theme: ref({}),
    title: ref(""),
    description: ref(""),
    lang: ref("en-US"),
    localePath: ref("/"),
  }),
  useRouter: () => ({
    route: ref({ path: "/" }),
    go: vi.fn().mockResolvedValue(undefined),
  }),
}));

config.global.stubs = {
  ClientOnly: defineComponent({
    setup(_, { slots }) {
      return () => (slots.default ? h("div", slots.default()) : null);
    },
  }),
};
