import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Recommendations from "../Recommendations.vue";

const sampleRecs = [
  {
    id: "1",
    name: "Alice Smith",
    title: "VP Engineering",
    company: "Acme Corp",
    testimonial: "Outstanding engineer",
    date: "2024-06-15",
  },
  {
    id: "2",
    name: "Bob Jones",
    title: "CTO",
    company: "Beta Inc",
    testimonial: "Great collaborator and leader",
    date: "2024-03-10",
  },
  {
    id: "3",
    name: "Carol Doe",
    title: "Director",
    company: "Acme Corp",
    testimonial: "Excellent problem solver",
    date: "2023-12-01",
  },
];

describe("Recommendations", () => {
  it("shows no-results message when recommendations is empty", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: [] } });
    expect(wrapper.text()).toContain("No recommendations found");
  });

  it("renders all recommendation cards", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const cards = wrapper.findAll(".recommendation-card");
    expect(cards).toHaveLength(3);
  });

  it("displays name, title, company, and testimonial", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const html = wrapper.html();
    expect(html).toContain("Alice Smith");
    expect(html).toContain("VP Engineering");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Outstanding engineer");
  });

  it("shows avatar with first letter of name", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const avatars = wrapper.findAll(".card-avatar");
    expect(avatars[0].text()).toBe("A");
    expect(avatars[1].text()).toBe("B");
    expect(avatars[2].text()).toBe("C");
  });

  it("formats dates correctly", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    expect(wrapper.html()).toContain("June 15, 2024");
  });

  it("sorts by date descending (newest first)", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const names = wrapper.findAll(".card-name").map(el => el.text());
    expect(names).toEqual(["Alice Smith", "Bob Jones", "Carol Doe"]);
  });

  it("filters by search query across name, title, company, testimonial", async () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const input = wrapper.find(".search-input");
    await input.setValue("leader");

    const cards = wrapper.findAll(".recommendation-card");
    expect(cards).toHaveLength(1);
    expect(wrapper.text()).toContain("Bob Jones");
  });

  it("filters by company", async () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const select = wrapper.find(".company-select");
    await select.setValue("Acme Corp");

    const cards = wrapper.findAll(".recommendation-card");
    expect(cards).toHaveLength(2);
  });

  it("populates company dropdown with unique sorted companies", () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const options = wrapper.findAll("option");
    expect(options.map(o => o.text())).toEqual(["All Companies", "Acme Corp", "Beta Inc"]);
  });

  it("shows results count when filter is active", async () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    expect(wrapper.find(".results-count").exists()).toBe(false);

    const select = wrapper.find(".company-select");
    await select.setValue("Beta Inc");

    expect(wrapper.find(".results-count").exists()).toBe(true);
    expect(wrapper.find(".results-count").text()).toContain("1 recommendation");
  });

  it("shows no-results when search matches nothing", async () => {
    const wrapper = mount(Recommendations, { props: { recommendations: sampleRecs } });
    const input = wrapper.find(".search-input");
    await input.setValue("zzzznonexistent");

    expect(wrapper.text()).toContain("No recommendations found");
  });
});
