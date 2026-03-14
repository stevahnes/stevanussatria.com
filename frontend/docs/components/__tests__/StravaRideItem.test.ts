import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";

vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("leaflet", () => ({
  default: { divIcon: vi.fn().mockReturnValue({}) },
}));
vi.mock("@vue-leaflet/vue-leaflet", () => {
  const stub = (name: string) =>
    defineComponent({
      name,
      props: {
        zoom: null,
        center: null,
        options: null,
        url: null,
        attribution: null,
        latLngs: null,
        color: null,
        weight: null,
        opacity: null,
        icon: null,
        latLng: null,
        position: null,
      },
      emits: ["ready", "click"],
      setup(_, { slots }) {
        return () => h("div", { class: `stub-${name}` }, slots.default?.());
      },
    });
  return {
    LMap: stub("LMap"),
    LTileLayer: stub("LTileLayer"),
    LPolyline: stub("LPolyline"),
    LMarker: stub("LMarker"),
    LPopup: stub("LPopup"),
    LControlZoom: stub("LControlZoom"),
  };
});

import StravaRideItem from "../StravaRideItem.vue";

const sampleActivity = {
  type: "EBikeRide",
  name: "Morning E-Bike",
  distance: 30000,
  moving_time: 3600,
  elapsed_time: 4200,
  total_elevation_gain: 250,
  average_watts: 150,
  kilojoules: 540,
  average_heartrate: 130,
  max_heartrate: 165,
  average_speed: 8.33,
  max_speed: 15.0,
  start_latlng: [1.35, 103.85] as [number, number],
  end_latlng: [1.36, 103.86] as [number, number],
  map: {
    summary_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  },
  start_date_local: "2024-06-15T07:30:00",
};

describe("StravaRideItem", () => {
  it("renders accordion header with activity name", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Morning E-Bike");
  });

  it("shows summary stats in collapsed state", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await flushPromises();

    const html = wrapper.html();
    expect(html).toContain("Time:");
    expect(html).toContain("Distance:");
    expect(html).toContain("Avg Speed:");
    expect(html).toContain("Power:");
    expect(html).toContain("HR:");
    expect(html).toContain("Energy:");
  });

  it("formats distance correctly", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("30.00 km");
  });

  it("formats time correctly", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("1:00:00");
  });

  it("starts collapsed (no accordion content)", () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("expands accordion on header click", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();

    expect(wrapper.find(".accordion-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Ride Details");
  });

  it("shows full stats when expanded", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
    });
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();

    const html = wrapper.html();
    expect(html).toContain("Total Time");
    expect(html).toContain("Moving Time");
    expect(html).toContain("Elevation");
    expect(html).toContain("Avg Power");
    expect(html).toContain("Avg HR");
    expect(html).toContain("Max HR");
  });

  it("collapses accordion on second header click", async () => {
    const TransitionStub = defineComponent({
      setup(_, { slots }) {
        return () => slots.default?.();
      },
    });
    const wrapper = mount(StravaRideItem, {
      props: { activity: sampleActivity },
      global: {
        stubs: { Transition: TransitionStub },
      },
    });
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".accordion-content").exists()).toBe(true);

    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();

    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("handles N/A for missing optional stats", async () => {
    const activityNoOptional = {
      ...sampleActivity,
      average_watts: null,
      kilojoules: null,
      average_heartrate: null,
      max_heartrate: null,
    };
    const wrapper = mount(StravaRideItem, {
      props: { activity: activityNoOptional },
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("N/A");
  });
});
