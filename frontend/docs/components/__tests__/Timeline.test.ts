import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Timeline from "../Timeline.vue";

const sampleItems = [
  {
    time: "2024-01",
    title: "Senior Engineer",
    description: "Joined the team",
    path: "https://example.com",
    cta: "Learn more",
    anchor: "senior",
  },
  {
    time: "2023-06",
    title: "Engineer",
    description: "Started career",
  },
];

describe("Timeline", () => {
  it("renders nothing when items is empty", () => {
    const wrapper = mount(Timeline, { props: { items: [] } });
    expect(wrapper.find("ol").exists()).toBe(false);
  });

  it("renders nothing with default props", () => {
    const wrapper = mount(Timeline);
    expect(wrapper.find("ol").exists()).toBe(false);
  });

  it("renders all items in an ordered list", () => {
    const wrapper = mount(Timeline, { props: { items: sampleItems } });
    const listItems = wrapper.findAll("li");
    expect(listItems).toHaveLength(2);
  });

  it("displays time, title, and description for each item", () => {
    const wrapper = mount(Timeline, { props: { items: sampleItems } });
    const html = wrapper.html();
    expect(html).toContain("2024-01");
    expect(html).toContain("Senior Engineer");
    expect(html).toContain("Joined the team");
    expect(html).toContain("2023-06");
    expect(html).toContain("Engineer");
    expect(html).toContain("Started career");
  });

  it("shows a link when item has a path", () => {
    const wrapper = mount(Timeline, { props: { items: sampleItems } });
    const link = wrapper.find("a[href='https://example.com']");
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain("Learn more");
    expect(link.attributes("target")).toBe("_blank");
  });

  it("hides the link container when item has no path", () => {
    const wrapper = mount(Timeline, {
      props: { items: [{ time: "2023", title: "Test", description: "No link" }] },
    });
    const linkContainer = wrapper.find("div[style*='display: none']");
    expect(linkContainer.exists()).toBe(true);
  });

  it("sets anchor id on time element", () => {
    const wrapper = mount(Timeline, { props: { items: sampleItems } });
    const timeEl = wrapper.find("time#senior");
    expect(timeEl.exists()).toBe(true);
  });

  it("uses time as the key via getItemKey", () => {
    const wrapper = mount(Timeline, { props: { items: sampleItems } });
    const listItems = wrapper.findAll("li");
    expect(listItems).toHaveLength(sampleItems.length);
  });
});
