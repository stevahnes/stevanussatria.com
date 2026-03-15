import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import ShaderBackground from "../ShaderBackground.vue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openPicker(wrapper: VueWrapper) {
  await flushPromises();
  await wrapper.vm.$nextTick();
  await wrapper.find(".picker-toggle").trigger("click");
  await wrapper.vm.$nextTick();
}

const SHADER_IDS = ["aurora", "velodrome", "keys", "signal", "topology"];
const SHADER_LABELS = ["Aurora", "Velodrome", "Keys", "Signal", "Topology"];
const SHADER_ICONS = ["✦", "◎", "♩", "⟁", "⬡"];

// ---------------------------------------------------------------------------

describe("ShaderBackground", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  // ── canvas ──────────────────────────────────────────────────────────────

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

  // ── picker mount ─────────────────────────────────────────────────────────

  it("renders the shader picker after mount", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".shader-picker").exists()).toBe(true);
  });

  it("shows the picker toggle button after mount", async () => {
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

  // ── picker open / close ───────────────────────────────────────────────────

  it("opens picker options on toggle click", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".picker-options").exists()).toBe(true);
  });

  it("closes picker options on second toggle click", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    await wrapper.find(".picker-toggle").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-options").exists()).toBe(false);
  });

  it("toggle chevron gets .rotated class when open", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.find(".toggle-chevron").classes()).toContain("rotated");
  });

  it("toggle chevron loses .rotated class when closed", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    await wrapper.find(".picker-toggle").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".toggle-chevron").classes()).not.toContain("rotated");
  });

  // ── picker content ────────────────────────────────────────────────────────

  it("renders an option for each of the 5 shaders", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.findAll(".picker-option").length).toBe(5);
  });

  it("renders the correct label for each shader option", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    const labels = wrapper.findAll(".option-label").map((el) => el.text());
    for (const label of SHADER_LABELS) {
      expect(labels).toContain(label);
    }
  });

  it("renders the correct icon for each shader option", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    const icons = wrapper.findAll(".option-icon").map((el) => el.text());
    for (const icon of SHADER_ICONS) {
      expect(icons).toContain(icon);
    }
  });

  it("marks exactly one option as active", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    expect(wrapper.findAll(".picker-option.active").length).toBe(1);
  });

  it("toggle button title reflects the active shader label", async () => {
    sessionStorage.setItem("activeShader", "velodrome");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").attributes("title")).toContain("Velodrome");
    sessionStorage.clear();
  });

  it("toggle button shows the active shader icon", async () => {
    sessionStorage.setItem("activeShader", "keys");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".toggle-icon").text()).toBe("♩");
    sessionStorage.clear();
  });

  it("toggle button has aria-label='Switch background'", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-toggle").attributes("aria-label")).toBe("Switch background");
  });

  // ── shader switching via picker ───────────────────────────────────────────

  it("clicking an option closes the picker", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    await wrapper.findAll(".picker-option")[0].trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-options").exists()).toBe(false);
  });

  it("clicking an option marks it as active", async () => {
    sessionStorage.setItem("activeShader", "aurora");
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    // Click the "signal" option (index 3)
    const signalOption = wrapper
      .findAll(".picker-option")
      .find((el) => el.text().includes("Signal"))!;
    await signalOption.trigger("click");
    await wrapper.vm.$nextTick();
    // Re-open to check
    await openPicker(wrapper);
    const active = wrapper.find(".picker-option.active");
    expect(active.text()).toContain("Signal");
    sessionStorage.clear();
  });

  it("clicking an option persists the choice to sessionStorage", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    const topologyOption = wrapper
      .findAll(".picker-option")
      .find((el) => el.text().includes("Topology"))!;
    await topologyOption.trigger("click");
    expect(sessionStorage.getItem("activeShader")).toBe("topology");
    sessionStorage.clear();
  });

  it("switching through all 5 shaders updates the toggle icon each time", async () => {
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();

    for (let i = 0; i < SHADER_IDS.length; i++) {
      await openPicker(wrapper);
      await wrapper.findAll(".picker-option")[i].trigger("click");
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".toggle-icon").text()).toBe(SHADER_ICONS[i]);
    }
    sessionStorage.clear();
  });

  // ── switchShader custom event ─────────────────────────────────────────────

  it("registers the switchShader event listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(ShaderBackground);
    expect(addSpy.mock.calls.map((c) => c[0])).toContain("switchShader");
    addSpy.mockRestore();
  });

  it("removes the switchShader event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(ShaderBackground);
    wrapper.unmount();
    expect(removeSpy.mock.calls.map((c) => c[0])).toContain("switchShader");
    removeSpy.mockRestore();
  });

  it("responds to switchShader custom event and updates active shader", async () => {
    sessionStorage.setItem("activeShader", "aurora");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();

    window.dispatchEvent(new CustomEvent("switchShader", { detail: { id: "signal" } }));
    await wrapper.vm.$nextTick();

    expect(sessionStorage.getItem("activeShader")).toBe("signal");

    // Toggle icon should reflect the new shader
    expect(wrapper.find(".toggle-icon").text()).toBe("⟁");
    sessionStorage.clear();
  });

  it("switchShader event closes the picker if it was open", async () => {
    wrapper = mount(ShaderBackground);
    await openPicker(wrapper);
    window.dispatchEvent(new CustomEvent("switchShader", { detail: { id: "keys" } }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".picker-options").exists()).toBe(false);
    sessionStorage.clear();
  });

  // ── sessionStorage integration ────────────────────────────────────────────

  it("uses stored shader from sessionStorage on mount", async () => {
    sessionStorage.setItem("activeShader", "topology");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".toggle-icon").text()).toBe("⬡");
    sessionStorage.clear();
  });

  it("falls back to a valid shader if sessionStorage has an unknown value", async () => {
    sessionStorage.setItem("activeShader", "nonexistent");
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    // Should render one of the valid icons, not crash
    const icon = wrapper.find(".toggle-icon").text();
    expect(SHADER_ICONS).toContain(icon);
    sessionStorage.clear();
  });

  it("writes a valid shader id to sessionStorage when none is set", async () => {
    sessionStorage.clear();
    wrapper = mount(ShaderBackground);
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(SHADER_IDS).toContain(sessionStorage.getItem("activeShader"));
  });

  // ── MutationObserver / theme ──────────────────────────────────────────────

  it("registers a MutationObserver on mount", () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
    wrapper = mount(ShaderBackground);
    expect(observeSpy).toHaveBeenCalled();
    observeSpy.mockRestore();
  });

  it("disconnects the MutationObserver on unmount", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    wrapper = mount(ShaderBackground);
    wrapper.unmount();
    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });

  // ── ResizeObserver ────────────────────────────────────────────────────────

  it("disconnects the ResizeObserver on unmount", () => {
    const disconnectSpy = vi.spyOn(ResizeObserver.prototype, "disconnect");
    wrapper = mount(ShaderBackground);
    wrapper.unmount();
    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});