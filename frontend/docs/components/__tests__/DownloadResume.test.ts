import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import DownloadResume from "../DownloadResume.vue";

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    setLineWidth: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue([]),
    output: vi.fn().mockReturnValue(new Blob()),
    save: vi.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    getStringUnitWidth: vi.fn().mockReturnValue(100),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    textWithLink: vi.fn(),
  })),
}));

vi.mock("../resume_builder/mapper", () => ({
  parseResumeMarkdown: vi.fn().mockReturnValue({
    name: "Test",
    contacts: [],
    sections: [],
  }),
}));

vi.mock("../resume_builder/templates/one-page-standard/logic", () => ({
  generateOnePageStandardPDF: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
});

describe("DownloadResume", () => {
  it("shows loading button initially", () => {
    const wrapper = mount(DownloadResume);
    expect(wrapper.text()).toContain("Loading...");
  });

  it("shows download button after hydration delay", async () => {
    const wrapper = mount(DownloadResume);
    expect(wrapper.find("[data-download-resume]").exists()).toBe(false);

    vi.advanceTimersByTime(150);
    await flushPromises();

    expect(wrapper.find("[data-download-resume]").exists()).toBe(true);
    expect(wrapper.text()).toContain("Download Resume");
  });

  it("accepts custom button text", async () => {
    const wrapper = mount(DownloadResume, {
      props: { buttonText: "Get PDF" },
    });

    vi.advanceTimersByTime(150);
    await flushPromises();

    expect(wrapper.text()).toContain("Get PDF");
  });

  it("renders exactly one button at any time", async () => {
    const wrapper = mount(DownloadResume);
    expect(wrapper.findAll("button")).toHaveLength(1);

    vi.advanceTimersByTime(150);
    await flushPromises();

    expect(wrapper.findAll("button")).toHaveLength(1);
  });

  it("loading button has reduced opacity style", () => {
    const wrapper = mount(DownloadResume);
    const btn = wrapper.find("button");
    expect(btn.attributes("style")).toContain("opacity");
    expect(btn.attributes("style")).toContain("wait");
  });
});
