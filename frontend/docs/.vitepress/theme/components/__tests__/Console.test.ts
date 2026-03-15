import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Console from "../Console.vue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOOT_WAIT = 1500;

const typeSlashCommand = () => {
  for (const char of "/terminal") {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
  }
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
};

async function openConsole(wrapper: VueWrapper) {
  typeSlashCommand();
  await new Promise((r) => setTimeout(r, BOOT_WAIT));
  await flushPromises();
}

async function runCommand(wrapper: VueWrapper, cmd: string) {
  const input = wrapper.find<HTMLInputElement>("input");
  await input.setValue(cmd);
  await input.trigger("keydown", { key: "Enter" });
  await flushPromises();
}

// ---------------------------------------------------------------------------
// Original tests
// ---------------------------------------------------------------------------

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
    const registeredEvents = addSpy.mock.calls.map((c) => c[0]);
    expect(registeredEvents).toContain("keydown");
    addSpy.mockRestore();
  });

  it("removes the global keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrapper = mount(Console);
    wrapper.unmount();
    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain("keydown");
    removeSpy.mockRestore();
  });

  it("opens when /terminal + Enter is typed", async () => {
    wrapper = mount(Console);
    typeSlashCommand();
    await new Promise((r) => setTimeout(r, 1500));
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(true);
  });

  it("has an input field when open", async () => {
    wrapper = mount(Console);
    typeSlashCommand();
    await new Promise((r) => setTimeout(r, 1500));
    await flushPromises();
    expect(wrapper.find("input").exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Slash hint
// ---------------------------------------------------------------------------

describe("Console — slash hint", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows slash hint as /terminal is typed", async () => {
    wrapper = mount(Console);
    await flushPromises();
    for (const char of "/ter") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
    }
    await flushPromises();
    expect(wrapper.find(".slash-hint").exists()).toBe(true);
    expect(wrapper.find(".slash-hint").text()).toContain("/ter");
  });

  it("does not show slash hint when not starting with /", async () => {
    wrapper = mount(Console);
    await flushPromises();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    await flushPromises();
    expect(wrapper.find(".slash-hint").exists()).toBe(false);
  });

  it("hides slash hint once panel is open", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.find(".slash-hint").exists()).toBe(false);
  });

  it("Backspace removes last char from slash buffer", async () => {
    wrapper = mount(Console);
    await flushPromises();
    for (const char of "/ter") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
    }
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    await flushPromises();
    expect(wrapper.find(".slash-hint").text()).toContain("/te");
  });

  it("Escape clears slash buffer without opening panel", async () => {
    wrapper = mount(Console);
    await flushPromises();
    for (const char of "/ter") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
    }
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();
    expect(wrapper.find(".slash-hint").exists()).toBe(false);
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

describe("Console — open / close", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows the console-panel after boot", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.find(".console-panel").exists()).toBe(true);
  });

  it("closes on Escape key", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("closes via the red dot", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-red").trigger("click");
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("closes via the ✕ titlebar button", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const closeBtn = wrapper.findAll(".titlebar-btn").find((b) => b.text().includes("✕"))!;
    await closeBtn.trigger("click");
    await flushPromises();
    expect(wrapper.find(".console-panel").exists()).toBe(false);
  });

  it("does not re-open if already open", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    typeSlashCommand();
    await flushPromises();
    expect(wrapper.findAll(".console-panel").length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

describe("Console — boot sequence", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("renders boot banner line after boot", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.find(".line-banner").exists()).toBe(true);
    expect(wrapper.find(".line-banner").text()).toContain("SATRIA OS");
  });

  it("shows the boot cursor while booting", async () => {
    wrapper = mount(Console);
    typeSlashCommand();
    await new Promise((r) => setTimeout(r, 50));
    await flushPromises();
    expect(wrapper.find(".boot-cursor").exists()).toBe(true);
  });

  it("shows the input row after boot completes", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.find(".console-input-row").exists()).toBe(true);
    expect(wrapper.find("input.console-input").exists()).toBe(true);
  });

  it("renders system line 'All systems nominal.' after boot", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const systemLines = wrapper.findAll(".line-system");
    expect(systemLines.some((l) => l.text().includes("All systems nominal"))).toBe(true);
  });

  it("renders output lines for each boot step", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.findAll(".line-output").length).toBeGreaterThan(3);
  });
});

// ---------------------------------------------------------------------------
// Command execution
// ---------------------------------------------------------------------------

describe("Console — command execution", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("echoes user input as a .line-input line", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "help");
    expect(wrapper.findAll(".line-input").some((l) => l.text().includes("help"))).toBe(true);
  });

  it("clears the input field after Enter", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const input = wrapper.find<HTMLInputElement>("input");
    await input.setValue("whoami");
    await input.trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(input.element.value).toBe("");
  });

  it("shows error for unknown command", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "foobar");
    const errorLines = wrapper.findAll(".line-error");
    expect(errorLines.some((l) => l.text().includes("command not found"))).toBe(true);
    expect(errorLines.some((l) => l.text().includes("foobar"))).toBe(true);
  });

  it("empty Enter does nothing", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const linesBefore = wrapper.findAll(".console-line").length;
    await wrapper.find("input").trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(wrapper.findAll(".console-line").length).toBe(linesBefore);
  });
});

// ---------------------------------------------------------------------------
// help
// ---------------------------------------------------------------------------

describe("Console — help command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("lists all expected commands", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "help");
    const text = wrapper.text();
    for (const cmd of ["chat", "soundcloud", "shader", "goto", "dock", "clear", "whoami", "skills", "contact", "theme", "glitch"]) {
      expect(text).toContain(cmd);
    }
  });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe("Console — clear command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("clears all output lines", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "clear");
    expect(wrapper.findAll(".console-line").length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// whoami
// ---------------------------------------------------------------------------

describe("Console — whoami command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("outputs site and role info", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "whoami");
    expect(wrapper.text()).toContain("stevanussatria.com");
    expect(wrapper.text()).toContain("Airwallex");
  });
});

// ---------------------------------------------------------------------------
// skills
// ---------------------------------------------------------------------------

describe("Console — skills command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("outputs skill categories", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "skills");
    expect(wrapper.text()).toContain("Product");
    expect(wrapper.text()).toContain("Engineering");
  });
});

// ---------------------------------------------------------------------------
// contact
// ---------------------------------------------------------------------------

describe("Console — contact command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("outputs LinkedIn and GitHub", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "contact");
    expect(wrapper.text()).toContain("linkedin.com");
    expect(wrapper.text()).toContain("github.com");
  });
});

// ---------------------------------------------------------------------------
// shader
// ---------------------------------------------------------------------------

describe("Console — shader command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("dispatches switchShader event for a valid shader", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const events: string[] = [];
    window.addEventListener("switchShader", (e: Event) => {
      events.push((e as CustomEvent).detail.id);
    });
    await runCommand(wrapper, "shader aurora");
    expect(events).toContain("aurora");
  });

  it("sets sessionStorage activeShader for a valid shader", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "shader velodrome");
    expect(sessionStorage.getItem("activeShader")).toBe("velodrome");
  });

  it("shows error for an unknown shader", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "shader nope");
    expect(wrapper.findAll(".line-error").some((l) => l.text().includes("unknown shader"))).toBe(true);
  });

  it("shows error when no shader argument given", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "shader");
    expect(wrapper.findAll(".line-error").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// chat
// ---------------------------------------------------------------------------

describe("Console — chat command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("dispatches activateChat with autoSend:true", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    let detail: { message: string; autoSend: boolean } | null = null;
    window.addEventListener("activateChat", (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    await runCommand(wrapper, "chat Tell me about Steve");
    expect(detail).not.toBeNull();
    expect(detail!.message).toBe("Tell me about Steve");
    expect(detail!.autoSend).toBe(true);
  });

  it("shows usage hint when no message given", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "chat");
    expect(wrapper.text()).toContain("Usage");
  });
});

// ---------------------------------------------------------------------------
// goto
// ---------------------------------------------------------------------------

describe("Console — goto command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows navigation confirmation for a valid page", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "goto home");
    expect(wrapper.text()).toContain("Navigating");
  });

  it("shows error for an unknown page", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "goto nowhere");
    expect(wrapper.findAll(".line-error").some((l) => l.text().includes("unknown page"))).toBe(true);
  });

  it("shows error when no page argument given", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "goto");
    expect(wrapper.findAll(".line-error").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// theme
// ---------------------------------------------------------------------------

describe("Console — theme command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("outputs confirmation for 'theme light'", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "theme light");
    expect(wrapper.text()).toContain("light mode");
  });

  it("outputs confirmation for 'theme dark'", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "theme dark");
    expect(wrapper.text()).toContain("dark mode");
  });

  it("toggles mode when no argument given", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "theme");
    expect(wrapper.text()).toMatch(/light mode|dark mode/);
  });
});

// ---------------------------------------------------------------------------
// dock
// ---------------------------------------------------------------------------

describe("Console — dock command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("outputs dock mode confirmation", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "dock");
    expect(wrapper.text()).toMatch(/bottom|right|float/);
  });

  it("yellow dot cycles dock mode", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-bottom");
  });

  it("cycle button in titlebar changes dock class", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const cycleBtn = wrapper.findAll(".titlebar-btn").find((b) => !b.text().includes("✕"))!;
    await cycleBtn.trigger("click");
    await flushPromises();
    expect(
      wrapper.find(".console-panel").classes().some((c) =>
        ["dock-bottom", "dock-right", "dock-float"].includes(c)
      )
    ).toBe(true);
  });

  it("green dot toggles float ↔ last docked position", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click"); // float → bottom
    await flushPromises();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-bottom");
    await wrapper.find(".dot-green").trigger("click"); // bottom → float
    await flushPromises();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-float");
    await wrapper.find(".dot-green").trigger("click"); // float → bottom
    await flushPromises();
    expect(wrapper.find(".console-panel").classes()).toContain("dock-bottom");
  });
});

// ---------------------------------------------------------------------------
// soundcloud
// ---------------------------------------------------------------------------

describe("Console — soundcloud command", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows usage when no subcommand given", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "soundcloud");
    expect(wrapper.text()).toContain("Usage");
  });

  it("shows usage for unknown subcommand", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "soundcloud blast");
    expect(wrapper.text()).toContain("Usage");
  });

  it("dispatches pauseSoundCloud event on pause", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const events: string[] = [];
    window.addEventListener("pauseSoundCloud", () => events.push("pause"));
    await runCommand(wrapper, "soundcloud pause");
    expect(events).toContain("pause");
  });

  it("dispatches nextSoundCloud event on next", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const events: string[] = [];
    window.addEventListener("nextSoundCloud", () => events.push("next"));
    await runCommand(wrapper, "soundcloud next");
    expect(events).toContain("next");
  });

  it("dispatches prevSoundCloud event on prev", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const events: string[] = [];
    window.addEventListener("prevSoundCloud", () => events.push("prev"));
    await runCommand(wrapper, "soundcloud prev");
    expect(events).toContain("prev");
  });
});

// ---------------------------------------------------------------------------
// glitch
// ---------------------------------------------------------------------------

describe("Console — glitch command", () => {
  let wrapper: VueWrapper;
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });

  it("outputs glitch start messages", async () => {
    wrapper = mount(Console);
    typeSlashCommand();
    await vi.advanceTimersByTimeAsync(BOOT_WAIT);
    await flushPromises();
    await runCommand(wrapper, "glitch");
    expect(wrapper.text()).toContain("INITIATING GLITCH SEQUENCE");
  });

  it("stops glitch when typed again", async () => {
    wrapper = mount(Console);
    typeSlashCommand();
    await vi.advanceTimersByTimeAsync(BOOT_WAIT);
    await flushPromises();
    await runCommand(wrapper, "glitch");
    await runCommand(wrapper, "glitch");
    expect(wrapper.text()).toContain("Systems restored");
  });
});

// ---------------------------------------------------------------------------
// Command history navigation
// ---------------------------------------------------------------------------

describe("Console — command history navigation", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("ArrowUp recalls last command", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "whoami");
    const input = wrapper.find<HTMLInputElement>("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    await flushPromises();
    expect(input.element.value).toBe("whoami");
  });

  it("ArrowDown after ArrowUp clears the input", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "whoami");
    const input = wrapper.find<HTMLInputElement>("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await flushPromises();
    expect(input.element.value).toBe("");
  });

  it("navigates multiple history entries with ArrowUp", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await runCommand(wrapper, "whoami");
    await runCommand(wrapper, "skills");
    const input = wrapper.find<HTMLInputElement>("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(input.element.value).toBe("skills");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(input.element.value).toBe("whoami");
  });
});

// ---------------------------------------------------------------------------
// Tab autocomplete
// ---------------------------------------------------------------------------

describe("Console — Tab autocomplete", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("Tab completes a partial command", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const input = wrapper.find<HTMLInputElement>("input");
    await input.setValue("wh");
    await input.trigger("keydown", { key: "Tab" });
    await flushPromises();
    expect(input.element.value).toBe("whoami");
  });

  it("Tab does nothing when input already matches a full command", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const input = wrapper.find<HTMLInputElement>("input");
    await input.setValue("help");
    await input.trigger("keydown", { key: "Tab" });
    await flushPromises();
    expect(input.element.value).toBe("help");
  });
});

// ---------------------------------------------------------------------------
// Ctrl+L
// ---------------------------------------------------------------------------

describe("Console — Ctrl+L clears output", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("Ctrl+L clears all console lines", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find("input").trigger("keydown", { key: "l", ctrlKey: true });
    await flushPromises();
    expect(wrapper.findAll(".console-line").length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// panelStyle computed
// ---------------------------------------------------------------------------

describe("Console — panelStyle computed", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("float panel has left/top inline style set", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    const style = wrapper.find(".console-panel").attributes("style") ?? "";
    expect(style).toMatch(/left:\s*\d+px/);
    expect(style).toMatch(/top:\s*\d+px/);
  });

  it("bottom-docked panel has width: 100%", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    expect(wrapper.find(".console-panel").attributes("style") ?? "").toContain("width: 100%");
  });

  it("right-docked panel has height: 100%", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click"); // → bottom
    await wrapper.find(".dot-yellow").trigger("click"); // → right
    await flushPromises();
    expect(wrapper.find(".console-panel").attributes("style") ?? "").toContain("height: 100%");
  });
});

// ---------------------------------------------------------------------------
// titlebarHint and dockCycleIcon computed
// ---------------------------------------------------------------------------

describe("Console — titlebarHint computed", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows 'float' hint when floating", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    expect(wrapper.find(".titlebar-hint").text()).toContain("float");
  });

  it("shows 'bottom' hint when docked to bottom", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click");
    await flushPromises();
    expect(wrapper.find(".titlebar-hint").text()).toContain("bottom");
  });

  it("shows 'right' hint when docked to right", async () => {
    wrapper = mount(Console);
    await openConsole(wrapper);
    await wrapper.find(".dot-yellow").trigger("click"); // → bottom
    await wrapper.find(".dot-yellow").trigger("click"); // → right
    await flushPromises();
    expect(wrapper.find(".titlebar-hint").text()).toContain("right");
  });
});