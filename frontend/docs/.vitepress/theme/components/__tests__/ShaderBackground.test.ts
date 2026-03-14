import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import ShaderBackground from "../ShaderBackground.vue";

describe("ShaderBackground", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it("renders a canvas element", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas").exists()).toBe(true);
  });

  it("canvas has the shader-bg class", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas.shader-bg").exists()).toBe(true);
  });

  it("canvas is marked as aria-hidden", () => {
    wrapper = mount(ShaderBackground);
    expect(wrapper.find("canvas").attributes("aria-hidden")).toBe("true");
  });

  it("renders the shader picker after mount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".shader-picker").exists()).toBe(true);
  });

  it("shows the picker toggle button", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").exists()).toBe(true);
  });

  it("picker options are hidden by default", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-options").exists()).toBe(false);
  });

  it("opens picker options on toggle click", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".picker-toggle").trigger("click");
    expect(wrapper.find(".picker-options").exists()).toBe(true);
  });

  it("renders an option for each shader", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".picker-toggle").trigger("click");
    const options = wrapper.findAll(".picker-option");
    expect(options.length).toBe(5);
  });

  it("marks the active shader in the picker", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".picker-toggle").trigger("click");
    const active = wrapper.find(".picker-option.active");
    expect(active.exists()).toBe(true);
  });

  it("registers the switchShader event listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(ShaderBackground);

    const registeredEvents = addSpy.mock.calls.map(c => c[0]);
    expect(registeredEvents).toContain("switchShader");

    addSpy.mockRestore();
  });

  it("cleans up event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(ShaderBackground);
    wrapper.unmount();

    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain("switchShader");

    removeSpy.mockRestore();
  });
});
