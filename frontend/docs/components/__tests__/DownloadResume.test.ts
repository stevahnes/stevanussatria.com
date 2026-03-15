import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import DownloadResume from "../DownloadResume.vue";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSave = vi.fn();
const mockOutput = vi.fn().mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    setLineWidth: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue([]),
    output: mockOutput,
    save: mockSave,
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    getStringUnitWidth: vi.fn().mockReturnValue(100),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    textWithLink: vi.fn(),
  })),
}));

vi.mock("../resume_builder/mapper", () => ({
  parseResumeMarkdown: vi.fn().mockReturnValue({ name: "Test", contacts: [], sections: [] }),
}));

vi.mock("../resume_builder/templates/one-page-standard/logic", () => ({
  generateOnePageStandardPDF: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// CRITICAL: seedVpDoc MUST be called BEFORE mounting the component.
// extractResumeContent() runs inside a setTimeout(100ms) in onMounted.
// If the .vp-doc element isn't in the DOM at that point, resumeMarkdown stays "".
const seedVpDoc = (html: string): (() => void) => {
  const div = document.createElement("div");
  div.className = "vp-doc";
  div.innerHTML = html;
  document.body.appendChild(div);
  return () => {
    if (div.parentNode) div.parentNode.removeChild(div);
  };
};

// Mount, advance past the 100ms hydration timer, and flush all promises.
const mountReady = async (props = {}) => {
  const wrapper = mount(DownloadResume, { props });
  vi.advanceTimersByTime(150);
  await flushPromises();
  return wrapper;
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("DownloadResume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSave.mockClear();
    mockOutput.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // Remove any leftover .vp-doc elements
    document.querySelectorAll(".vp-doc").forEach(el => el.parentNode?.removeChild(el));
  });

  // ── Loading / hydration state ────────────────────────────────────────────────

  it("shows loading button initially", () => {
    const wrapper = mount(DownloadResume);
    expect(wrapper.text()).toContain("Loading...");
  });

  it("shows download button after hydration delay", async () => {
    const wrapper = await mountReady();
    expect(wrapper.find("[data-download-resume]").exists()).toBe(true);
    expect(wrapper.text()).toContain("Download Resume");
  });

  it("accepts custom button text", async () => {
    const wrapper = await mountReady({ buttonText: "Get PDF" });
    expect(wrapper.text()).toContain("Get PDF");
  });

  it("renders exactly one button at any time", async () => {
    const wrapper = mount(DownloadResume);
    expect(wrapper.findAll("button")).toHaveLength(1);
    vi.advanceTimersByTime(150);
    await flushPromises();
    expect(wrapper.findAll("button")).toHaveLength(1);
  });

  it("loading button has wait cursor and reduced opacity", () => {
    const wrapper = mount(DownloadResume);
    const style = wrapper.find("button").attributes("style") ?? "";
    expect(style).toContain("opacity");
    expect(style).toContain("wait");
  });

  it("download button does not have wait cursor", async () => {
    const wrapper = await mountReady();
    expect(wrapper.find("[data-download-resume]").attributes("style")).not.toContain("wait");
  });

  // ── downloadResume guard: empty markdown ─────────────────────────────────────

  it("does not call jsPDF.save when no .vp-doc exists (resumeMarkdown empty)", async () => {
    // No seedVpDoc → extractResumeContent finds nothing → resumeMarkdown = ""
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();
    expect(mockSave).not.toHaveBeenCalled();
  });

  // ── extractResumeContent: filtering ─────────────────────────────────────────

  it("strips button elements from .vp-doc before extracting", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p>Hello</p><button>Click me</button>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    const md = mock.mock.calls[0]?.[0] as string;
    expect(md).toContain("Hello");
    expect(md).not.toContain("Click me");
    cleanup();
  });

  it("strips elements containing 'Advocado' from .vp-doc", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p>Real content</p><div>Chat with Advocado</div>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    const md = mock.mock.calls[0]?.[0] as string;
    expect(md).not.toContain("Advocado");
    cleanup();
  });

  // ── processNode / HTML → Markdown tag conversion ─────────────────────────────
  // Each test seeds .vp-doc BEFORE mounting so the content is captured at init time.

  it("converts <h1> to # heading in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<h1>My Name</h1>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("# My Name");
    cleanup();
  });

  it("converts <h2> to ## heading in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<h2>Experience</h2>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("## Experience");
    cleanup();
  });

  it("converts <h3> to ### heading in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<h3>Role</h3>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("### Role");
    cleanup();
  });

  it("converts <p> to paragraph text in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p>Some paragraph text</p>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("Some paragraph text");
    cleanup();
  });

  it("converts <ul><li> to markdown list items", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<ul><li>Item one</li><li>Item two</li></ul>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    const md = mock.mock.calls[0]?.[0] as string;
    expect(md).toContain("- Item one");
    expect(md).toContain("- Item two");
    cleanup();
  });

  it("converts <strong> to **bold** in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p><strong>Bold text</strong></p>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("**Bold text**");
    cleanup();
  });

  it("converts <b> to **bold** in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p><b>Also bold</b></p>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("**Also bold**");
    cleanup();
  });

  it("converts <a> to [text](href) link in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc('<p><a href="https://example.com">My Link</a></p>');
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("[My Link](https://example.com)");
    cleanup();
  });

  it("converts <br> to newline in markdown", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<p>Line one<br>Line two</p>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("Line one\nLine two");
    cleanup();
  });

  it("passes unknown tags through as plain text via processChildren fallback", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<section><span>Span content</span></section>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    expect(mock.mock.calls[0]?.[0] as string).toContain("Span content");
    cleanup();
  });

  it("handles nested tags correctly (e.g. <strong> inside <li>)", async () => {
    const { parseResumeMarkdown } = await import("../resume_builder/mapper");
    const mock = parseResumeMarkdown as ReturnType<typeof vi.fn>;
    mock.mockClear();

    const cleanup = seedVpDoc("<ul><li><strong>Key:</strong> value</li></ul>");
    const wrapper = await mountReady();
    await wrapper.find("[data-download-resume]").trigger("click");
    await flushPromises();

    const md = mock.mock.calls[0]?.[0] as string;
    expect(md).toContain("**Key:**");
    expect(md).toContain("value");
    cleanup();
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  it("does not throw when generateOnePageStandardPDF throws", async () => {
    const { generateOnePageStandardPDF } = await import(
      "../resume_builder/templates/one-page-standard/logic"
    );
    (generateOnePageStandardPDF as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("PDF generation failed");
    });

    const cleanup = seedVpDoc("<p>Content</p>");
    const wrapper = await mountReady();
    await expect(
      wrapper
        .find("[data-download-resume]")
        .trigger("click")
        .then(() => flushPromises()),
    ).resolves.not.toThrow();
    cleanup();
  });

  // ── Mouse interaction styles ─────────────────────────────────────────────────

  it("applies translateY(-1px) on mouseenter", async () => {
    const wrapper = await mountReady();
    const btn = wrapper.find("[data-download-resume]");
    await btn.trigger("mouseenter");
    expect((btn.element as HTMLElement).style.transform).toBe("translateY(-1px)");
  });

  it("resets transform to translateY(0) on mouseleave", async () => {
    const wrapper = await mountReady();
    const btn = wrapper.find("[data-download-resume]");
    await btn.trigger("mouseenter");
    await btn.trigger("mouseleave");
    expect((btn.element as HTMLElement).style.transform).toBe("translateY(0)");
  });
});
