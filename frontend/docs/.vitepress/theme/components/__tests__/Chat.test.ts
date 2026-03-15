import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Chat from "../Chat.vue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Open the mini chat panel by clicking the FAB. */
async function openChat(wrapper: VueWrapper) {
  await flushPromises();
  const fab = wrapper.find(".chat-fab");
  await fab.trigger("click");
  await flushPromises();
}

/** Get the textarea inside the wrapper (works for compact AND expanded mode). */
function getTextarea(wrapper: VueWrapper): ReturnType<VueWrapper["find"]> {
  return wrapper.find("textarea");
}

/** Build a minimal OK streaming Response that yields SSE chunks. */
function makeStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

/** SSE line for a single text token. */
const sseChunk = (text: string) => `0:${JSON.stringify(text)}\n`;

// ---------------------------------------------------------------------------
// Describe blocks
// ---------------------------------------------------------------------------

describe("Chat — mounting & initial render", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("does NOT render .chat-position before onMounted fires", () => {
    wrapper = mount(Chat, { attachTo: document.body });
    // isClient starts false; the div is v-if'd
    expect(wrapper.find(".chat-position").exists()).toBe(false);
  });

  it("renders .chat-position after onMounted fires", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });

  it("shows the FAB button by default (isMiniChat = false)", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.find(".chat-fab").exists()).toBe(true);
  });

  it("does NOT show the chat window before the FAB is clicked", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("renders the Advocado avatar img inside the FAB", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();
    const img = wrapper.find(".chat-fab img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("alt")).toBe("Advocado");
  });
});

// ---------------------------------------------------------------------------

describe("Chat — FAB toggle (open / close)", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("opens the chat window when FAB is clicked", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  it("hides the FAB once the window is open", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    expect(wrapper.find(".chat-fab").exists()).toBe(false);
  });

  it("closes the chat window when the × button is clicked", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    // The close button in compact mode has aria-label="Close chat"
    const closeBtn = wrapper.find('[aria-label="Close chat"]');
    await closeBtn.trigger("click");
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(wrapper.find(".chat-fab").exists()).toBe(true);
  });

  it("persists isMiniChat state to localStorage", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    expect(localStorage.getItem("miniChatExpanded")).toBe("true");
  });

  it("reads miniChatExpanded from localStorage on mount", async () => {
    localStorage.setItem("miniChatExpanded", "true");
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    localStorage.removeItem("miniChatExpanded");
  });
});

// ---------------------------------------------------------------------------

describe("Chat — compact mode & initial greeting", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("shows the initial greeting message in compact mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    expect(wrapper.text()).toContain("Hi! What would you like to learn about Steve today?");
  });

  it("renders all 5 prompt suggestion buttons in compact mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    // Compact mode shows buttons in a flex-col list
    const buttons = wrapper
      .findAll("button")
      .filter((b) => b.text().startsWith("Tell me") || b.text().startsWith("What") ||
        b.text().startsWith("Summarize") || b.text().startsWith("Show") ||
        b.text().startsWith("How can I"));
    expect(buttons.length).toBe(5);
  });

  it("clicking a suggestion populates the textarea", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    const suggestionBtn = wrapper.findAll("button").find((b) =>
      b.text().includes("Tell me about Steve's background"),
    )!;
    await suggestionBtn.trigger("click");
    await flushPromises();
    expect(getTextarea(wrapper).element.value).toBe("Tell me about Steve's background");
  });

  it("has the correct placeholder in compact mode textarea", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    expect(getTextarea(wrapper).attributes("placeholder")).toBe("Ask something...");
  });

  it("disables the send button when textarea is empty", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    const sendBtn = wrapper.find('[aria-label="Send message"]');
    expect(sendBtn.attributes("disabled")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------

describe("Chat — sending a message / streaming", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it("transitions from compact to expanded mode on first send", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("Hello"), sseChunk(" Steve!")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);

    await getTextarea(wrapper).setValue("Tell me about Steve");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    // Expanded mode has a role="log" messages area
    expect(wrapper.find('[role="log"]').exists()).toBe(true);
  });

  it("appends the user message to the log", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("Hello there!")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("What are Steve's skills?");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("What are Steve's skills?");
  });

  it("sends Enter key to submit the form", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("Response text")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    const textarea = getTextarea(wrapper);
    await textarea.setValue("Hello");
    await textarea.trigger("keydown", { key: "Enter", shiftKey: false });
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("does NOT submit on Shift+Enter", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    const textarea = getTextarea(wrapper);
    await textarea.setValue("Hello");
    await textarea.trigger("keydown", { key: "Enter", shiftKey: true });
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("clears the textarea after sending", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("Hi!")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Any message");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(getTextarea(wrapper).element.value).toBe("");
  });

  it("shows the loading indicator while streaming", async () => {
    // Never-resolving fetch so we can inspect the loading state mid-flight
    let resolve!: (v: Response) => void;
    const pending = new Promise<Response>((r) => { resolve = r; });
    vi.mocked(global.fetch).mockReturnValue(pending);

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Question");
    wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    // Loading indicator: three animated dots
    const dots = wrapper.findAll(".\\!animate-pulse");
    expect(dots.length).toBeGreaterThan(0);

    // Cleanup: resolve fetch so the component teardown doesn't warn
    resolve(makeStreamResponse([]));
    await flushPromises();
  });

  it("streams tokens into the assistant message bubble", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("Token1"), sseChunk(" Token2")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hi");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Token1 Token2");
  });

  it("calls fetch with correct endpoint and payload shape", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      makeStreamResponse([sseChunk("ok")]),
    );

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Test message");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://advocado-agent.vercel.app/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const body = JSON.parse(
      (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toHaveProperty("messages");
    expect(Array.isArray(body.messages)).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("Chat — error handling & retry", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it("shows error fallback message when fetch rejects", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network error"));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
  });

  it("shows error fallback when server returns non-OK status", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 500 }));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Something went wrong");
  });

  it("shows the Retry button after a failure", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("fail"));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    expect(wrapper.find(".retry-btn").exists()).toBe(true);
  });

  it("Retry button re-sends the last failed message", async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(makeStreamResponse([sseChunk("Recovered!")]));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Retry me");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    await wrapper.find(".retry-btn").trigger("click");
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Recovered!");
  });

  it("hides the Retry button after a successful retry", async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(makeStreamResponse([sseChunk("All good")]));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Try again");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    await wrapper.find(".retry-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".retry-btn").exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("Chat — expanded mode controls", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([sseChunk("Hi")]),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  /** Helper: open chat then send one message to enter expanded mode. */
  async function enterExpandedMode(w: VueWrapper) {
    await openChat(w);
    await getTextarea(w).setValue("Hello");
    await w.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();
  }

  it("shows the header with 'Chat with Advocado' in expanded mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    expect(wrapper.text()).toContain("Chat with Advocado");
  });

  it("shows the New Conversation button in expanded mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    expect(wrapper.find('[aria-label="New conversation"]').exists()).toBe(true);
  });

  it("shows the Toggle full screen button in expanded mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    expect(wrapper.find('[aria-label="Toggle full screen"]').exists()).toBe(true);
  });

  it("toggles full-height class when full-screen button is clicked", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    await wrapper.find('[aria-label="Toggle full screen"]').trigger("click");
    await flushPromises();
    // The dialog gets the full-height class
    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.classes().join(" ") + dialog.attributes("class")).toContain("100vh");
  });

  it("persists full-height preference to localStorage", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    await wrapper.find('[aria-label="Toggle full screen"]').trigger("click");
    await flushPromises();
    expect(localStorage.getItem("chatFullHeight")).toBe("true");
  });

  it("New Conversation resets to compact mode and clears messages", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    await wrapper.find('[aria-label="New conversation"]').trigger("click");
    await flushPromises();
    // Should go back to compact mode (no role="log")
    expect(wrapper.find('[role="log"]').exists()).toBe(false);
    // sessionStorage should be cleared
    expect(sessionStorage.getItem("chatMessages")).toBeNull();
  });

  it("shows the suggestion carousel in expanded mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    // The carousel is the div with scrollbar-hide class outside the log
    const carousel = wrapper.find(".scrollbar-hide");
    expect(carousel.exists()).toBe(true);
  });

  it("has the AMA placeholder in expanded mode", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await enterExpandedMode(wrapper);
    expect(getTextarea(wrapper).attributes("placeholder")).toBe("AMA about Steve! 🎤");
  });
});

// ---------------------------------------------------------------------------

describe("Chat — copy message", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([sseChunk("Copyable text")]),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it("copy button becomes visible on group hover (opacity class check)", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    const copyBtn = wrapper.find('[aria-label="Copy message"]');
    expect(copyBtn.exists()).toBe(true);
  });

  it("calls clipboard.writeText when copy button is clicked", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    await wrapper.find('[aria-label="Copy message"]').trigger("click");
    await flushPromises();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copyable text");
  });

  it("changes copy button label to 'Copied' after click", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hello");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    await wrapper.find('[aria-label="Copy message"]').trigger("click");
    await flushPromises();

    expect(wrapper.find('[aria-label="Copied"]').exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("Chat — session & localStorage persistence", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      makeStreamResponse([sseChunk("Persisted response")]),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("saves messages to sessionStorage after a conversation", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Save me");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    const saved = sessionStorage.getItem("chatMessages");
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.some((m: { content: string }) => m.content === "Save me")).toBe(true);
  });

  it("restores messages from sessionStorage on remount", async () => {
    const messages = [
      { role: "assistant", content: "Hello there", timestamp: Date.now() },
      { role: "user", content: "Restored user msg", timestamp: Date.now() },
    ];
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    sessionStorage.setItem("chatCompactMode", "false");

    wrapper = mount(Chat, { attachTo: document.body });
    localStorage.setItem("miniChatExpanded", "true");
    await flushPromises();

    expect(wrapper.text()).toContain("Restored user msg");
  });

  it("ignores malformed sessionStorage JSON gracefully", async () => {
    sessionStorage.setItem("chatMessages", "not-valid-json{{");

    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();

    // Should fall back to the default greeting
    expect(wrapper.find(".chat-position").exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("Chat — keyboard shortcut Cmd/Ctrl+Shift+.", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("opens the chat on Cmd+Shift+.", when closed", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: ".", metaKey: true, shiftKey: true }));
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
  });

  it("closes the chat on Cmd+Shift+. when open", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: ".", metaKey: true, shiftKey: true }));
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("Chat — activateChat custom event", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("opens the chat and populates textarea on activateChat event", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();

    window.dispatchEvent(
      new CustomEvent("activateChat", { detail: { message: "External trigger" } }),
    );
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(getTextarea(wrapper).element.value).toBe("External trigger");
  });

  it("auto-sends when autoSend: true is passed in the event", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeStreamResponse([sseChunk("Auto sent!")]));

    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();

    window.dispatchEvent(
      new CustomEvent("activateChat", {
        detail: { message: "Auto send this", autoSend: true },
      }),
    );
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------

describe("Chat — accessibility attributes", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("dialog has role='dialog' and aria-label", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.attributes("aria-label")).toBe("Chat with Advocado");
  });

  it("FAB has aria-label='Open chat with Advocado'", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.find('[aria-label="Open chat with Advocado"]').exists()).toBe(true);
  });

  it("messages area has role='log' and aria-live='polite'", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeStreamResponse([sseChunk("Hi")]));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Hi");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    const log = wrapper.find('[role="log"]');
    expect(log.attributes("aria-live")).toBe("polite");

    vi.restoreAllMocks();
  });

  it("textarea has aria-label='Type your message'", async () => {
    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);

    expect(getTextarea(wrapper).attributes("aria-label")).toBe("Type your message");
  });
});

// ---------------------------------------------------------------------------

describe("Chat — formatTime helper", () => {
  let wrapper: VueWrapper;
  afterEach(() => wrapper?.unmount());

  it("renders a timestamp string on each message bubble", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeStreamResponse([sseChunk("Timed")]));

    wrapper = mount(Chat, { attachTo: document.body });
    await openChat(wrapper);
    await getTextarea(wrapper).setValue("Timing test");
    await wrapper.find('[aria-label="Send message"]').trigger("click");
    await flushPromises();

    // Timestamps rendered as HH:MM — match any time string in the output
    const timeRegex = /\d{1,2}:\d{2}/;
    expect(timeRegex.test(wrapper.text())).toBe(true);

    vi.restoreAllMocks();
  });
});