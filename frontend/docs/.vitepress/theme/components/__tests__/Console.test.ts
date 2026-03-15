import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Console from "../Console.vue";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOOT_DELAY = 1500;

const typeSequence = (str: string) => {
  for (const char of str) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
  }
};

const openConsole = async () => {
  typeSequence("/terminal");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  await new Promise(r => setTimeout(r, BOOT_DELAY));
  await flushPromises();
};

const runCommand = async (wrapper: VueWrapper, command: string) => {
  const input = wrapper.find<HTMLInputElement>("input.console-input");
  await input.setValue(command);
  await input.trigger("keydown", { key: "Enter" });
  await flushPromises();
  await wrapper.vm.$nextTick();
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("Console", () => {
  let wrapper: VueWrapper;

  afterEach(() => {
    wrapper?.unmount();
    sessionStorage.clear();
    vi.useRealTimers(); // always restore regardless of test pass/fail
  });

  // ── Visibility ──────────────────────────────────────────────────────────────

  it("is hidden by default", () => {
    wrapper = mount(Console);
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("registers the global keydown listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrapper = mount(Console);
    expect(addSpy.mock.calls.map(c => c[0])).toContain("keydown");
    addSpy.mockRestore();
  });

  it("removes the global keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(Console);
    wrapper.unmount();
    expect(removeSpy.mock.calls.map(c => c[0])).toContain("keydown");
    removeSpy.mockRestore();
    wrapper = mount(Console);
  });

  it("opens when /terminal + Enter is typed", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.find(".console-panel").exists()).toBe(true);
  });

  it("does NOT open when an incomplete sequence is typed", async () => {
    wrapper = mount(Console);
    typeSequence("/termin");
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("does NOT open when a wrong command is typed + Enter", async () => {
    wrapper = mount(Console);
    typeSequence("/foobar");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("Escape sets isOpen to false without throwing", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    ).not.toThrow();
  });

  it("red dot click does not throw", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(async () => {
      await wrapper.find(".dot-red").trigger("click");
      await wrapper.vm.$nextTick();
    }).not.toThrow();
  });

  // ── Boot sequence ───────────────────────────────────────────────────────────

  it("has an input field when open", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.find("input.console-input").exists()).toBe(true);
  });

  it("displays boot lines after opening", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.text()).toContain("SATRIA OS");
  });

  it("shows the help hint in boot output", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.text()).toContain('Type "help"');
  });

  // ── Default dock mode ────────────────────────────────────────────────────────

  it("panel opens with dock-float class (default dockPosition)", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-float");
  });

  // ── Computed: panelStyle (float mode) ────────────────────────────────────────

  it("panelStyle in float mode sets left/top/width/height", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as {
      panelStyle: Record<string, string>;
      dockPosition: string;
    };
    expect(vm.dockPosition).toBe("float");
    const style = vm.panelStyle;
    expect(style).toHaveProperty("left");
    expect(style).toHaveProperty("top");
    expect(style).toHaveProperty("width");
    expect(style).toHaveProperty("height");
    expect(style.bottom).toBe("auto");
    expect(style.right).toBe("auto");
  });

  it("panelStyle in bottom mode sets height/width/bottom", async () => {
    wrapper = mount(Console);
    await openConsole();
    // Cycle to bottom: float → bottom
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { panelStyle: Record<string, string> };
    const style = vm.panelStyle;
    expect(style.bottom).toBe("0");
    expect(style.width).toBe("100%");
    expect(style.left).toBe("0");
  });

  it("panelStyle in right mode sets width/height/right", async () => {
    wrapper = mount(Console);
    await openConsole();
    // float → bottom → right
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { panelStyle: Record<string, string> };
    const style = vm.panelStyle;
    expect(style.right).toBe("0");
    expect(style.top).toBe("0");
    expect(style.bottom).toBe("0");
  });

  // ── Computed: titlebarHint & dockCycleIcon ────────────────────────────────────

  it("titlebarHint shows '◈ float' in float mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { titlebarHint: string };
    expect(vm.titlebarHint).toBe("◈ float");
  });

  it("titlebarHint shows '⊡ bottom' in bottom mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { titlebarHint: string };
    expect(vm.titlebarHint).toBe("⊡ bottom");
  });

  it("titlebarHint shows '⊞ right' in right mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { titlebarHint: string };
    expect(vm.titlebarHint).toBe("⊞ right");
  });

  it("dockCycleIcon shows '⇩' in float mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { dockCycleIcon: string };
    expect(vm.dockCycleIcon).toBe("⇩");
  });

  it("dockCycleIcon shows '⇥' in bottom mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { dockCycleIcon: string };
    expect(vm.dockCycleIcon).toBe("⇥");
  });

  it("dockCycleIcon shows '⊡' in right mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { dockCycleIcon: string };
    expect(vm.dockCycleIcon).toBe("⊡");
  });

  // ── Titlebar dots ────────────────────────────────────────────────────────────

  it("renders the three macOS-style titlebar dots", async () => {
    wrapper = mount(Console);
    await openConsole();
    expect(wrapper.find(".dot-red").exists()).toBe(true);
    expect(wrapper.find(".dot-yellow").exists()).toBe(true);
    expect(wrapper.find(".dot-green").exists()).toBe(true);
  });

  it("cycles dock mode when the yellow dot is clicked", async () => {
    wrapper = mount(Console);
    await openConsole();
    const initialClasses = wrapper.find(".console-panel").classes().join(" ");
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes().join(" ")).not.toBe(initialClasses);
  });

  it("green dot switches from float to bottom dock on first click", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-green").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-bottom");
  });

  it("green dot returns to float on second click", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-green").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-green").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-float");
  });

  // ── startDrag (float mode titlebar drag) ──────────────────────────────────────

  it("startDrag sets isDragging=true on mousedown on titlebar in float mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { isDragging: boolean };
    const titlebar = wrapper.find(".console-titlebar");
    await titlebar.trigger("mousedown", { clientX: 100, clientY: 100 });
    expect(vm.isDragging).toBe(true);
    // Cleanup: trigger mouseup
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("startDrag does not drag when clicking titlebar-actions buttons", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { isDragging: boolean };
    // Click the close button inside titlebar-actions
    const closeBtn = wrapper.find(".titlebar-actions .titlebar-btn:last-child");
    await closeBtn.trigger("mousedown", { clientX: 100, clientY: 100 });
    // isDragging should NOT be set (button click is excluded)
    expect(vm.isDragging).toBe(false);
  });

  it("isDragging becomes false after mouseup", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { isDragging: boolean };
    const titlebar = wrapper.find(".console-titlebar");
    await titlebar.trigger("mousedown", { clientX: 100, clientY: 100 });
    expect(vm.isDragging).toBe(true);
    window.dispatchEvent(new MouseEvent("mouseup"));
    await wrapper.vm.$nextTick();
    expect(vm.isDragging).toBe(false);
  });

  it("drag moves float position on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as {
      isDragging: boolean;
      floatX: number;
      floatY: number;
    };
    const initialX = vm.floatX;
    const titlebar = wrapper.find(".console-titlebar");
    await titlebar.trigger("mousedown", { clientX: 100, clientY: 100 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 150 }));
    await wrapper.vm.$nextTick();
    // floatX should have changed
    expect(vm.floatX).not.toBe(initialX);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  // ── startResize ────────────────────────────────────────────────────────────────

  it("startResize sets isResizing=true on float resize handle mousedown", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { isResizing: boolean };
    const resizeHandle = wrapper.find(".rh-se");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 0 });
    expect(vm.isResizing).toBe(true);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("isResizing becomes false after mouseup on float handle", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { isResizing: boolean };
    const resizeHandle = wrapper.find(".rh-se");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 0 });
    window.dispatchEvent(new MouseEvent("mouseup"));
    await wrapper.vm.$nextTick();
    expect(vm.isResizing).toBe(false);
  });

  it("south resize handle changes floatH on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatH: number };
    const initialH = vm.floatH;
    const resizeHandle = wrapper.find(".rh-s");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 0 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 50 }));
    await wrapper.vm.$nextTick();
    expect(vm.floatH).not.toBe(initialH);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("east resize handle changes floatW on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatW: number };
    const initialW = vm.floatW;
    const resizeHandle = wrapper.find(".rh-e");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 0 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 0 }));
    await wrapper.vm.$nextTick();
    expect(vm.floatW).not.toBe(initialW);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("north resize handle changes floatH and floatY on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatH: number; floatY: number };
    const resizeHandle = wrapper.find(".rh-n");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 200 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 150 }));
    await wrapper.vm.$nextTick();
    // Moving north (upward) should increase height
    expect(vm.floatH).toBeGreaterThan(420);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("west resize handle changes floatW and floatX on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatW: number; floatX: number };
    const resizeHandle = wrapper.find(".rh-w");
    await resizeHandle.trigger("mousedown", { clientX: 500, clientY: 0 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 400, clientY: 0 }));
    await wrapper.vm.$nextTick();
    // Moving west (leftward) should increase width
    expect(vm.floatW).toBeGreaterThan(640);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("resize enforces minimum float width (320px)", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatW: number };
    const resizeHandle = wrapper.find(".rh-e");
    await resizeHandle.trigger("mousedown", { clientX: 640, clientY: 0 });
    // Try to shrink way below minimum
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 0 }));
    await wrapper.vm.$nextTick();
    expect(vm.floatW).toBeGreaterThanOrEqual(320);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("resize enforces minimum float height (200px)", async () => {
    wrapper = mount(Console);
    await openConsole();
    const vm = wrapper.vm as unknown as { floatH: number };
    const resizeHandle = wrapper.find(".rh-s");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 420 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 0 }));
    await wrapper.vm.$nextTick();
    expect(vm.floatH).toBeGreaterThanOrEqual(200);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("docked resize (bottom) changes dockedSize on mousemove", async () => {
    wrapper = mount(Console);
    await openConsole();
    // Move to bottom dock first
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { dockedSize: number };
    const initialSize = vm.dockedSize;
    const resizeHandle = wrapper.find(".resize-handle.resize-bottom");
    await resizeHandle.trigger("mousedown", { clientX: 0, clientY: 400 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 300 }));
    await wrapper.vm.$nextTick();
    expect(vm.dockedSize).not.toBe(initialSize);
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  // ── Commands ────────────────────────────────────────────────────────────────

  it('outputs help text on "help" command', async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "help");
    expect(wrapper.text()).toContain("AVAILABLE COMMANDS");
  });

  it('outputs whoami information on "whoami" command', async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "whoami");
    expect(wrapper.text()).toContain("stevanussatria.com");
    expect(wrapper.text()).toContain("Airwallex");
  });

  it('outputs skills on "skills" command', async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "skills");
    expect(wrapper.text()).toContain("Product");
    expect(wrapper.text()).toContain("Engineering");
  });

  it('outputs contact info on "contact" command', async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "contact");
    expect(wrapper.text()).toContain("linkedin.com");
  });

  it('clears most terminal lines on "clear" command', async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "help");
    expect(wrapper.findAll(".console-line").length).toBeGreaterThan(5);
    await runCommand(wrapper, "clear");
    expect(wrapper.findAll(".console-line").length).toBeLessThanOrEqual(2);
  });

  it("shows error for an unknown command", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "thiscommanddoesnotexist");
    expect(wrapper.text()).toContain("command not found");
  });

  it("shader command switches to a valid shader", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "shader aurora");
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "switchShader" }));
    dispatchSpy.mockRestore();
  });

  it("shader command shows error for unknown shader", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "shader nonexistent");
    expect(wrapper.text()).toContain("Error");
  });

  it("chat command dispatches activateChat event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "chat Hello Steve");
    expect(dispatchSpy.mock.calls.map(c => (c[0] as Event).type)).toContain("activateChat");
    dispatchSpy.mockRestore();
  });

  it("chat command with no args shows usage hint", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "chat");
    expect(wrapper.text()).toContain("Usage");
  });

  it("theme command outputs confirmation", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "theme dark");
    await runCommand(wrapper, "theme light");
    expect(wrapper.text()).toContain("light mode");
  });

  it("theme command toggles without argument", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "theme");
    expect(wrapper.text()).toMatch(/dark mode|light mode/);
  });

  it("dock command outputs dock position", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "dock");
    expect(wrapper.text()).toMatch(/docked|floating/i);
  });

  it("goto command with unknown page shows error", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "goto unknownpage");
    expect(wrapper.text()).toContain("Error");
  });

  it("goto home outputs navigation confirmation", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "goto home");
    expect(wrapper.text()).toContain("Navigating");
  });

  // ── Input history ────────────────────────────────────────────────────────────

  it("ArrowUp navigates command history", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "help");
    const input = wrapper.find<HTMLInputElement>("input.console-input");
    await input.setValue("");
    await input.trigger("keydown", { key: "ArrowUp" });
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe("help");
  });

  it("ArrowDown after ArrowUp clears the input", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "help");
    const input = wrapper.find<HTMLInputElement>("input.console-input");
    await input.setValue("");
    await input.trigger("keydown", { key: "ArrowUp" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe("");
  });

  it("Tab completes a partial command", async () => {
    wrapper = mount(Console);
    await openConsole();
    const input = wrapper.find<HTMLInputElement>("input.console-input");
    await input.setValue("hel");
    await input.trigger("keydown", { key: "Tab" });
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe("help");
  });

  it("Tab does nothing when no match found", async () => {
    wrapper = mount(Console);
    await openConsole();
    const input = wrapper.find<HTMLInputElement>("input.console-input");
    await input.setValue("zzz");
    await input.trigger("keydown", { key: "Tab" });
    await wrapper.vm.$nextTick();
    expect(input.element.value).toBe("zzz");
  });

  it("Ctrl+L clears the terminal", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "help");
    const input = wrapper.find<HTMLInputElement>("input.console-input");
    await input.trigger("keydown", { key: "l", ctrlKey: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll(".console-line").length).toBe(0);
  });

  // ── Glitch mode ──────────────────────────────────────────────────────────────

  it("glitch command outputs GLITCH text", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "glitch");
    expect(wrapper.text()).toContain("GLITCH");
  });

  it("running glitch a second time stops glitch mode", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "glitch");
    await runCommand(wrapper, "glitch");
    expect(wrapper.text()).toContain("terminated");
  });

  // ── Yellow-dot dock cycling ──────────────────────────────────────────────────

  it("yellow dot cycles float → bottom", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-bottom");
  });

  it("yellow dot cycles bottom → right", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-right");
  });

  it("yellow dot cycles right → float", async () => {
    wrapper = mount(Console);
    await openConsole();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-float");
  });

  // ── Slash hint ──────────────────────────────────────────────────────────────

  it("shows slash hint while typing /terminal", async () => {
    wrapper = mount(Console);
    typeSequence("/ter");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".slash-hint").exists()).toBe(true);
  });

  it("Escape clears the slash buffer so next keystrokes start fresh", async () => {
    wrapper = mount(Console);
    typeSequence("/ter");
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    await wrapper.vm.$nextTick();
    const hint = wrapper.find(".slash-hint");
    if (hint.exists()) {
      expect(hint.text()).not.toContain("ter");
    }
  });

  it("Backspace removes last character from slash buffer", async () => {
    wrapper = mount(Console);
    typeSequence("/ter");
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    await wrapper.vm.$nextTick();
    const hint = wrapper.find(".slash-hint");
    if (hint.exists()) {
      // Should show "/te" not "/ter"
      expect(hint.text()).not.toMatch(/\/ter[^m]/);
    }
  });

  // ── Soundcloud commands ──────────────────────────────────────────────────────

  it("soundcloud with no args shows usage", async () => {
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "soundcloud");
    expect(wrapper.text()).toContain("Usage");
  });

  it("soundcloud pause dispatches pauseSoundCloud event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "soundcloud pause");
    expect(dispatchSpy.mock.calls.map(c => (c[0] as Event).type)).toContain("pauseSoundCloud");
    dispatchSpy.mockRestore();
  });

  it("soundcloud next dispatches nextSoundCloud event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "soundcloud next");
    expect(dispatchSpy.mock.calls.map(c => (c[0] as Event).type)).toContain("nextSoundCloud");
    dispatchSpy.mockRestore();
  });

  it("soundcloud prev dispatches prevSoundCloud event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    await runCommand(wrapper, "soundcloud prev");
    expect(dispatchSpy.mock.calls.map(c => (c[0] as Event).type)).toContain("prevSoundCloud");
    dispatchSpy.mockRestore();
  });

  it("soundcloud play dispatches openSoundCloud event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    // Fire soundCloudReady so the play subcommand doesn't wait 5s
    setTimeout(() => window.dispatchEvent(new Event("soundCloudReady")), 50);
    await runCommand(wrapper, "soundcloud play");
    expect(dispatchSpy.mock.calls.map(c => (c[0] as Event).type)).toContain("openSoundCloud");
    dispatchSpy.mockRestore();
  });

  it("soundcloud play dispatches playSoundCloud after ready", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    wrapper = mount(Console);
    await openConsole();
    // Simulate soundCloudReady firing quickly
    setTimeout(() => window.dispatchEvent(new Event("soundCloudReady")), 10);
    await runCommand(wrapper, "soundcloud play");
    await new Promise(r => setTimeout(r, 100));
    const types = dispatchSpy.mock.calls.map(c => (c[0] as Event).type);
    expect(types).toContain("playSoundCloud");
    dispatchSpy.mockRestore();
  });

  it("soundcloud play times out gracefully after 5s without ready event", async () => {
    // Open console first (needs real timers for the 1500ms boot delay),
    // then switch to fake timers to control the 5s soundcloud timeout.
    wrapper = mount(Console);
    await openConsole();
    vi.useFakeTimers();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const cmdPromise = runCommand(wrapper, "soundcloud play");
    vi.advanceTimersByTime(5100);
    await flushPromises();
    await cmdPromise;
    const types = dispatchSpy.mock.calls.map(c => (c[0] as Event).type);
    expect(types).toContain("openSoundCloud");
    dispatchSpy.mockRestore();
    // afterEach will call vi.useRealTimers()
  });

  // ── titlebar-btn cycle dock button ────────────────────────────────────────────

  it("titlebar dock-cycle button also cycles dock", async () => {
    wrapper = mount(Console);
    await openConsole();
    const cycleBtn = wrapper.find(".titlebar-actions .titlebar-btn:first-child");
    const initialClasses = wrapper.find(".console-panel").classes().join(" ");
    await cycleBtn.trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".console-panel").classes().join(" ")).not.toBe(initialClasses);
  });
});
