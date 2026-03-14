import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import Giscus from "../Giscus.vue";

let observeCallback: IntersectionObserverCallback;
const disconnectMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        observeCallback = cb;
      }
      observe = vi.fn();
      disconnect = disconnectMock;
      unobserve = vi.fn();
    },
  );
  disconnectMock.mockClear();
});

describe("Giscus", () => {
  it("shows loading skeleton initially", () => {
    const wrapper = mount(Giscus);
    expect(wrapper.find(".giscus-loading").exists()).toBe(true);
    expect(wrapper.find(".loading-skeleton").exists()).toBe(true);
  });

  it("renders the giscus container div", () => {
    const wrapper = mount(Giscus);
    expect(wrapper.find(".giscus").exists()).toBe(true);
  });

  it("creates an IntersectionObserver on mount", () => {
    mount(Giscus);
    expect(observeCallback).toBeDefined();
  });

  it("appends giscus script when intersection is triggered", async () => {
    const wrapper = mount(Giscus);
    const giscusDiv = wrapper.find(".giscus").element;

    observeCallback(
      [{ isIntersecting: true, target: giscusDiv } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await flushPromises();

    const script = giscusDiv.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.src).toContain("giscus.app/client.js");
    expect(script?.getAttribute("data-repo")).toBe("stevahnes/stevanussatria.com");
    expect(script?.getAttribute("data-theme")).toBe("light");
  });

  it("disconnects observer after intersection", async () => {
    const wrapper = mount(Giscus);
    const giscusDiv = wrapper.find(".giscus").element;

    observeCallback(
      [{ isIntersecting: true, target: giscusDiv } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await flushPromises();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it("does not append script when not intersecting", async () => {
    const wrapper = mount(Giscus);
    const giscusDiv = wrapper.find(".giscus").element;

    observeCallback(
      [{ isIntersecting: false, target: giscusDiv } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await flushPromises();

    const script = giscusDiv.querySelector("script");
    expect(script).toBeNull();
  });

  it("hides loading skeleton after script loads", async () => {
    const wrapper = mount(Giscus);
    const giscusDiv = wrapper.find(".giscus").element;

    observeCallback(
      [{ isIntersecting: true, target: giscusDiv } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await flushPromises();

    const script = giscusDiv.querySelector("script");
    script?.onload?.(new Event("load"));
    await flushPromises();

    expect(wrapper.find(".giscus-loading").exists()).toBe(false);
  });
});
