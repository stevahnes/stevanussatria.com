import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Chat from "../Chat.vue";

describe("Chat", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it("renders the chat container after mount", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });

  it("shows the chat toggle FAB by default", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    const fab = wrapper.find("button");
    expect(fab.exists()).toBe(true);
  });

  it("is not expanded initially", async () => {
    wrapper = mount(Chat);
    await flushPromises();
    expect(wrapper.find(".mini-chat").exists()).toBe(false);
  });

  it("renders after the isClient flag is set in onMounted", async () => {
    wrapper = mount(Chat);
    expect(wrapper.find(".chat-position").exists()).toBe(false);
    await flushPromises();
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });
});
