import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import SoundCloudPlayer from "../SoundCloudPlayer.vue";

const expand = async (wrapper: VueWrapper) => {
  await wrapper.find(".sc-collapsed").trigger("click");
};

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
    await expand(wrapper);
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
    expect(wrapper.find(".sc-collapsed").exists()).toBe(false);
  });

  it("loads the iframe on first expansion", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").exists()).toBe(true);
    expect(wrapper.find("iframe").attributes("src")).toContain("soundcloud.com/player");
  });

  it("collapses back when the minimize button is clicked", async () => {
    await expand(wrapper);
    await wrapper.find(".sc-header-btn").trigger("click");
    expect(wrapper.find(".sc-collapsed").exists()).toBe(true);
    expect(wrapper.find(".sc-expanded").exists()).toBe(false);
  });

  it("does not show playing indicator when paused", () => {
    expect(wrapper.find(".sc-playing-indicator").exists()).toBe(false);
  });

  it("shows track info placeholders in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-title").text()).toBe("Loading...");
    expect(wrapper.find(".sc-artist").text()).toBe("SoundCloud");
  });

  it("shows track counter in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-track-counter").text()).toBe("1 / 0");
  });

  it("disables controls while loading", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-play-btn").attributes("disabled")).toBeDefined();
    wrapper.findAll(".sc-nav-btn").forEach(btn => {
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  it("registers window event listeners on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const w = mount(SoundCloudPlayer);
    const events = addSpy.mock.calls.map(c => c[0]);
    expect(events).toContain("openSoundCloud");
    expect(events).toContain("playSoundCloud");
    expect(events).toContain("pauseSoundCloud");
    expect(events).toContain("nextSoundCloud");
    expect(events).toContain("prevSoundCloud");
    w.unmount();
    addSpy.mockRestore();
  });

  it("removes window event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const w = mount(SoundCloudPlayer);
    w.unmount();
    const events = removeSpy.mock.calls.map(c => c[0]);
    expect(events).toContain("openSoundCloud");
    expect(events).toContain("playSoundCloud");
    expect(events).toContain("pauseSoundCloud");
    expect(events).toContain("nextSoundCloud");
    expect(events).toContain("prevSoundCloud");
    removeSpy.mockRestore();
  });

  it("opens when the openSoundCloud event fires", async () => {
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("renders the progress bar in expanded state", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-progress").exists()).toBe(true);
    expect(wrapper.findAll(".sc-time")).toHaveLength(2);
    expect(wrapper.find(".sc-seek-bar").exists()).toBe(true);
  });

  it("accepts a custom playlistUrl prop", async () => {
    const customUrl = "https://soundcloud.com/test/sets/my-playlist";
    const w = mount(SoundCloudPlayer, { props: { playlistUrl: customUrl } });
    await w.vm.$nextTick();
    await w.find(".sc-collapsed").trigger("click");
    expect(w.find("iframe").attributes("src")).toContain(encodeURIComponent(customUrl));
    w.unmount();
  });

  it("collapsed button has the music note icon", () => {
    expect(wrapper.find(".sc-note-icon").exists()).toBe(true);
  });

  it("collapsed button contains the sc-music-note wrapper", () => {
    expect(wrapper.find(".sc-music-note").exists()).toBe(true);
  });

  it("expanded header contains track title and artist", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-header").exists()).toBe(true);
    expect(wrapper.find(".sc-title").exists()).toBe(true);
    expect(wrapper.find(".sc-artist").exists()).toBe(true);
  });

  it("expanded controls section has a play button and two nav buttons", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-play-btn").exists()).toBe(true);
    expect(wrapper.findAll(".sc-nav-btn")).toHaveLength(2);
  });

  it("play button renders a spinner while loading", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-spinner").exists()).toBe(true);
  });

  it("seek bar fill starts at 0%", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-seek-fill").attributes("style")).toContain("width: 0%");
  });

  it("both time displays show 0:00 at start", async () => {
    await expand(wrapper);
    const times = wrapper.findAll(".sc-time");
    expect(times[0].text()).toBe("0:00");
    expect(times[1].text()).toBe("0:00");
  });

  it("iframe src contains auto_play=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("auto_play=false");
  });

  it("iframe src includes show_artwork=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("show_artwork=false");
  });

  it("iframe src includes buying=false", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toContain("buying=false");
  });

  it("iframe has the sc-iframe class (off-screen positioning)", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").classes()).toContain("sc-iframe");
  });

  it("iframe has allow='autoplay; encrypted-media'", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("allow")).toContain("autoplay");
  });

  it("does not change the iframe src on second expansion", async () => {
    await expand(wrapper);
    const firstSrc = wrapper.find("iframe").attributes("src");
    await wrapper.find(".sc-header-btn").trigger("click");
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src")).toBe(firstSrc);
  });

  it("dispatching openSoundCloud twice still shows expanded (idempotent)", async () => {
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new Event("openSoundCloud"));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".sc-expanded").exists()).toBe(true);
  });

  it("playSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("playSoundCloud"))).not.toThrow();
  });

  it("pauseSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("pauseSoundCloud"))).not.toThrow();
  });

  it("nextSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("nextSoundCloud"))).not.toThrow();
  });

  it("prevSoundCloud event does not throw when widget is not ready", () => {
    expect(() => window.dispatchEvent(new Event("prevSoundCloud"))).not.toThrow();
  });

  it("uses the piano-covers playlist URL by default", async () => {
    await expand(wrapper);
    expect(wrapper.find("iframe").attributes("src") ?? "").toContain("piano-covers");
  });

  it("URL-encodes the playlist URL in the iframe src", async () => {
    const specialUrl = "https://soundcloud.com/user/sets/special playlist";
    const w = mount(SoundCloudPlayer, { props: { playlistUrl: specialUrl } });
    await flushPromises();
    await w.find(".sc-collapsed").trigger("click");
    const src = w.find("iframe").attributes("src") ?? "";
    expect(src).not.toContain(" ");
    w.unmount();
  });

  it("clicking the seek bar does not throw when widget is not ready", async () => {
    await expand(wrapper);
    await expect(wrapper.find(".sc-seek-bar").trigger("click")).resolves.not.toThrow();
  });

  it("sc-player-container has 'expanded' class when open", async () => {
    await expand(wrapper);
    expect(wrapper.find(".sc-player-container").classes()).toContain("expanded");
  });

  it("sc-player-container does NOT have 'expanded' class when collapsed", () => {
    expect(wrapper.find(".sc-player-container").classes()).not.toContain("expanded");
  });
});
