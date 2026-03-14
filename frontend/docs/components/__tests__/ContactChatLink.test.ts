import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ContactChatLink from "../ContactChatLink.vue";

describe("ContactChatLink", () => {
  it("renders with default slot text", () => {
    const wrapper = mount(ContactChatLink);
    expect(wrapper.text()).toBe("Contact");
  });

  it("renders custom slot content", () => {
    const wrapper = mount(ContactChatLink, {
      slots: { default: "Get in touch" },
    });
    expect(wrapper.text()).toBe("Get in touch");
  });

  it("applies default link class", () => {
    const wrapper = mount(ContactChatLink);
    const link = wrapper.find("a");
    expect(link.classes()).toContain("text-blue-600");
  });

  it("applies custom link class", () => {
    const wrapper = mount(ContactChatLink, {
      props: { linkClass: "custom-link" },
    });
    const link = wrapper.find("a");
    expect(link.classes()).toContain("custom-link");
  });

  it("has correct aria-label", () => {
    const wrapper = mount(ContactChatLink);
    expect(wrapper.find("a").attributes("aria-label")).toBe("Open chat to contact Steve");
  });

  it("accepts custom aria-label", () => {
    const wrapper = mount(ContactChatLink, {
      props: { ariaLabel: "Custom label" },
    });
    expect(wrapper.find("a").attributes("aria-label")).toBe("Custom label");
  });

  it("dispatches activateChat CustomEvent on click with default message", async () => {
    const handler = vi.fn();
    window.addEventListener("activateChat", handler);

    const wrapper = mount(ContactChatLink);
    await wrapper.find("a").trigger("click");

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ message: "How can I contact Steve?" });

    window.removeEventListener("activateChat", handler);
  });

  it("dispatches activateChat CustomEvent with custom message", async () => {
    const handler = vi.fn();
    window.addEventListener("activateChat", handler);

    const wrapper = mount(ContactChatLink, {
      props: { message: "Hello there" },
    });
    await wrapper.find("a").trigger("click");

    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ message: "Hello there" });

    window.removeEventListener("activateChat", handler);
  });

  it("prevents default link navigation", () => {
    const wrapper = mount(ContactChatLink);
    const link = wrapper.find("a");
    expect(link.attributes("href")).toBe("#");
    expect(link.attributes("role")).toBe("button");
  });
});
