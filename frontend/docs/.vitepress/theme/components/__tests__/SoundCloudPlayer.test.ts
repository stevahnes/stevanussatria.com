import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import SoundCloudPlayer from "../SoundCloudPlayer.vue";

describe("SoundCloudPlayer", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(SoundCloudPlayer);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("renders the player container after mount", () => {
    expect(wrapper.find(".sc-player").exists()).toBe(true);
  });

  it("starts in collapsed state", () => {
    expect(wrapper.find(".sc-collapsed").exists()).toBe(true);
    expect(wrapper.find(".sc-expanded").exists()).toBe(false);
  });

  it("does not render the iframe before expansion", () => {
    expect(wrapper.find("iframe").exists()).toBe(false);
  });

  it("expands when the collapsed button is clicked", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
    expect(wrapper.find(".sc-collapsed").exists()).toBe(false);
  });

  it("loads the iframe on first expansion", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find("iframe").exists()).toBe(true);
    expect(wrapper.find("iframe").attributes("src")).toContain("soundcloud.com/player");
  });

  it("collapses back when the minimize button is clicked", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);

    await wrapper.find(".sc-header-btn").trigger("click");
    expect(wrapper.find(".sc-collapsed").exists()).toBe(true);
    expect(wrapper.find(".sc-expanded").exists()).toBe(false);
  });

  it("does not show playing indicator when paused", () => {
    expect(wrapper.find(".sc-playing-indicator").exists()).toBe(false);
  });

  it("shows track info placeholders in expanded state", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find(".sc-title").text()).toBe("Loading...");
    expect(wrapper.find(".sc-artist").text()).toBe("SoundCloud");
  });

  it("shows track counter in expanded state", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find(".sc-track-counter").text()).toBe("1 / 0");
  });

  it("disables controls while loading", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    const playBtn = wrapper.find(".sc-play-btn");
    const navBtns = wrapper.findAll(".sc-nav-btn");

    expect(playBtn.attributes("disabled")).toBeDefined();
    navBtns.forEach(btn => {
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  it("registers window event listeners on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const w = mount(SoundCloudPlayer);

    const registeredEvents = addSpy.mock.calls.map(c => c[0]);
    expect(registeredEvents).toContain("openSoundCloud");
    expect(registeredEvents).toContain("playSoundCloud");
    expect(registeredEvents).toContain("pauseSoundCloud");
    expect(registeredEvents).toContain("nextSoundCloud");
    expect(registeredEvents).toContain("prevSoundCloud");

    w.unmount();
    addSpy.mockRestore();
  });

  it("removes window event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const w = mount(SoundCloudPlayer);
    w.unmount();

    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain("openSoundCloud");
    expect(removedEvents).toContain("playSoundCloud");
    expect(removedEvents).toContain("pauseSoundCloud");
    expect(removedEvents).toContain("nextSoundCloud");
    expect(removedEvents).toContain("prevSoundCloud");

    removeSpy.mockRestore();
  });

  it("opens when the openSoundCloud event fires", async () => {
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("renders the progress bar in expanded state", async () => {
    await wrapper.find(".sc-collapsed").trigger("click");
    expect(wrapper.find(".sc-progress").exists()).toBe(true);
    expect(wrapper.findAll(".sc-time")).toHaveLength(2);
    expect(wrapper.find(".sc-seek-bar").exists()).toBe(true);
  });

  it("accepts a custom playlistUrl prop", async () => {
    const customUrl = "https://soundcloud.com/test/sets/my-playlist";
    const w = mount(SoundCloudPlayer, { props: { playlistUrl: customUrl } });
    await w.vm.$nextTick();
    await w.find(".sc-collapsed").trigger("click");
    const iframe = w.find("iframe");
    expect(iframe.attributes("src")).toContain(encodeURIComponent(customUrl));
    w.unmount();
  });
});
