import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Console from "../Console.vue";

const typeSlashCommand = () => {
  for (const char of "/terminal") {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
  }
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
};

describe("Console", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it("is hidden by default", () => {
    wrapper = mount(Console);
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("registers the global keydown listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(Console);

    const registeredEvents = addSpy.mock.calls.map(c => c[0]);
    expect(registeredEvents).toContain("keydown");

    addSpy.mockRestore();
  });

  it("removes the global keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(Console);
    wrapper.unmount();

    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain("keydown");

    removeSpy.mockRestore();
  });

  it("opens when /terminal + Enter is typed", async () => {
    wrapper = mount(Console);
    typeSlashCommand();

    // Boot sequence uses setTimeout delays
    await new Promise(r => setTimeout(r, 1500));
    await flushPromises();

    expect(wrapper.find(".console-panel").exists()).toBe(true);
  });

  it("has an input field when open", async () => {
    wrapper = mount(Console);
    typeSlashCommand();

    await new Promise(r => setTimeout(r, 1500));
    await flushPromises();

    expect(wrapper.find("input").exists()).toBe(true);
  });
});
