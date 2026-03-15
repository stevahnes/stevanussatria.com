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

// Stub <Transition> so accordion v-if resolves immediately
const TransitionStub = defineComponent({
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

import StravaRideItem from "../StravaRideItem.vue";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseActivity = {
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
  map: { summary_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
  start_date_local: "2024-06-15T07:30:00",
};

const mountItem = async (activityOverrides = {}, globalOpts = {}) => {
  const wrapper = mount(StravaRideItem, {
    props: { activity: { ...baseActivity, ...activityOverrides } },
    global: { stubs: { Transition: TransitionStub }, ...globalOpts },
  });
  await flushPromises();
  return wrapper;
};

const mountExpanded = async (activityOverrides = {}) => {
  const wrapper = await mountItem(activityOverrides);
  await wrapper.find(".accordion-header").trigger("click");
  await flushPromises();
  return wrapper;
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe("StravaRideItem", () => {
  // ── Existing tests ────────────────────────────────────────────────────────

  it("renders accordion header with activity name", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("Morning E-Bike");
  });

  it("shows summary stats in collapsed state", async () => {
    const wrapper = await mountItem();
    const html = wrapper.html();
    expect(html).toContain("Time:");
    expect(html).toContain("Distance:");
    expect(html).toContain("Avg Speed:");
    expect(html).toContain("Power:");
    expect(html).toContain("HR:");
    expect(html).toContain("Energy:");
  });

  it("formats distance correctly (km)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("30.00 km");
  });

  it("formats time correctly (h:mm:ss)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.text()).toContain("1:00:00");
  });

  it("starts collapsed (no accordion content)", async () => {
    const wrapper = await mountItem();
    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("expands accordion on header click", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Ride Details");
  });

  it("shows full stats when expanded", async () => {
    const wrapper = await mountExpanded();
    const html = wrapper.html();
    expect(html).toContain("Total Time");
    expect(html).toContain("Moving Time");
    expect(html).toContain("Elevation");
    expect(html).toContain("Avg Power");
    expect(html).toContain("Avg HR");
    expect(html).toContain("Max HR");
  });

  it("collapses accordion on second header click", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".accordion-content").exists()).toBe(false);
  });

  it("handles N/A for missing optional stats", async () => {
    const wrapper = await mountItem({
      average_watts: null,
      kilojoules: null,
      average_heartrate: null,
      max_heartrate: null,
    });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── formatDistance ────────────────────────────────────────────────────────

  it("formats distance < 1000m in metres", async () => {
    const wrapper = await mountItem({ distance: 500 });
    expect(wrapper.text()).toContain("500 m");
  });

  it("formats distance exactly 1000m as km", async () => {
    const wrapper = await mountItem({ distance: 1000 });
    expect(wrapper.text()).toContain("1.00 km");
  });

  // ── formatTime ────────────────────────────────────────────────────────────

  it("formats time under 1 hour as mm:ss", async () => {
    // 5 minutes 30 seconds = 330 seconds
    const wrapper = await mountItem({ moving_time: 330 });
    expect(wrapper.text()).toContain("5:30");
  });

  it("formats time with zero seconds as mm:00", async () => {
    const wrapper = await mountItem({ moving_time: 300 }); // 5:00
    expect(wrapper.text()).toContain("5:00");
  });

  it("formats elapsed time (4200s = 1:10:00)", async () => {
    const wrapper = await mountExpanded();
    expect(wrapper.text()).toContain("1:10:00");
  });

  // ── formatSpeed ───────────────────────────────────────────────────────────

  it("formats average speed in km/h", async () => {
    // 8.33 m/s * 3.6 = 29.988 ≈ 30.0 km/h
    const wrapper = await mountItem({ average_speed: 8.333 });
    expect(wrapper.text()).toContain("30.0 km/h");
  });

  it("formats max speed in km/h", async () => {
    const wrapper = await mountExpanded({ max_speed: 10.0 }); // 36.0 km/h
    expect(wrapper.text()).toContain("36.0 km/h");
  });

  // ── formatElevation ───────────────────────────────────────────────────────

  it("formats elevation gain in metres", async () => {
    const wrapper = await mountExpanded({ total_elevation_gain: 312.7 });
    expect(wrapper.text()).toContain("313 m");
  });

  // ── formatPower ───────────────────────────────────────────────────────────

  it("formats power in watts", async () => {
    const wrapper = await mountItem({ average_watts: 200 });
    expect(wrapper.text()).toContain("200 W");
  });

  it("shows N/A for null power", async () => {
    const wrapper = await mountItem({ average_watts: null });
    expect(wrapper.text()).toContain("N/A");
  });

  it("shows N/A for undefined power", async () => {
    const wrapper = await mountItem({ average_watts: undefined });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── formatEnergy ──────────────────────────────────────────────────────────

  it("formats energy in kJ", async () => {
    const wrapper = await mountItem({ kilojoules: 750.4 });
    expect(wrapper.text()).toContain("750 kJ");
  });

  it("shows N/A for null energy", async () => {
    const wrapper = await mountItem({ kilojoules: null });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── formatHeartRate ───────────────────────────────────────────────────────

  it("formats heart rate in bpm (rounds)", async () => {
    const wrapper = await mountItem({ average_heartrate: 132.7 });
    expect(wrapper.text()).toContain("133 bpm");
  });

  it("shows N/A for null heart rate", async () => {
    const wrapper = await mountItem({ average_heartrate: null });
    expect(wrapper.text()).toContain("N/A");
  });

  // ── getHeaderColorClasses — activity type variants ────────────────────────

  it("renders Ride type with bike icon", async () => {
    const wrapper = await mountItem({ type: "Ride", name: "Road Ride" });
    expect(wrapper.text()).toContain("Road Ride");
    // The SVG for Ride type has circles (wheels)
    expect(wrapper.html()).toContain("circle");
  });

  it("renders Hike type with hike icon", async () => {
    const wrapper = await mountItem({ type: "Hike", name: "Trail Hike" });
    expect(wrapper.text()).toContain("Trail Hike");
    // Hike SVG has a path (boot shape)
    expect(wrapper.html()).toContain("svg");
  });

  it("renders Run type with run icon", async () => {
    const wrapper = await mountItem({ type: "Run", name: "Morning Run" });
    expect(wrapper.text()).toContain("Morning Run");
    expect(wrapper.html()).toContain("svg");
  });

  it("renders EBikeRide type with e-bike icon", async () => {
    const wrapper = await mountItem({ type: "EBikeRide", name: "E-Bike Morning" });
    expect(wrapper.text()).toContain("E-Bike Morning");
    expect(wrapper.html()).toContain("svg");
  });

  it("renders unknown type without crashing (defaults to Ride styling)", async () => {
    const wrapper = await mountItem({ type: "Walk", name: "Evening Walk" });
    expect(wrapper.text()).toContain("Evening Walk");
  });

  // ── decodePolyline ────────────────────────────────────────────────────────

  it("renders route when map.polyline is present", async () => {
    const wrapper = await mountItem({
      map: { polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
    });
    // Component mounts without error and has correct structure
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
  });

  it("falls back to start/end latlng when no polyline", async () => {
    const wrapper = await mountItem({ map: {} });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
  });

  it("handles missing map prop entirely", async () => {
    const wrapper = await mountItem({ map: undefined });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
  });

  it("handles corrupted polyline gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Pass invalid polyline that will cause decodePolyline to behave unexpectedly
    const wrapper = await mountItem({ map: { summary_polyline: "!!invalid!!" } });
    expect(wrapper.find(".ride-accordion-item").exists()).toBe(true);
    consoleSpy.mockRestore();
  });

  // ── mapCenter computed ────────────────────────────────────────────────────

  it("uses start_latlng as map center", async () => {
    const wrapper = await mountItem({ start_latlng: [10.0, 50.0] as [number, number] });
    const vm = wrapper.vm as unknown as { mapCenter: [number, number] };
    expect(vm.mapCenter[0]).toBe(10.0);
    expect(vm.mapCenter[1]).toBe(50.0);
  });

  it("falls back to mid-route coordinate when no start_latlng", async () => {
    const wrapper = await mountItem({
      start_latlng: undefined,
      end_latlng: undefined,
      map: { summary_polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
    });
    const vm = wrapper.vm as unknown as { mapCenter: [number, number] };
    expect(Array.isArray(vm.mapCenter)).toBe(true);
    expect(vm.mapCenter.length).toBe(2);
  });

  // ── mapBounds computed ────────────────────────────────────────────────────

  it("computes mapBounds from route coordinates", async () => {
    const wrapper = await mountItem();
    const vm = wrapper.vm as unknown as { mapBounds: [[number, number], [number, number]] | null };
    expect(vm.mapBounds).not.toBeNull();
    if (vm.mapBounds) {
      expect(vm.mapBounds).toHaveLength(2);
      // SW bound lat < NE bound lat
      expect(vm.mapBounds[0][0]).toBeLessThan(vm.mapBounds[1][0]);
    }
  });

  it("returns null mapBounds when no route coordinates", async () => {
    const wrapper = await mountItem({
      map: {},
      start_latlng: undefined as unknown as [number, number],
      end_latlng: undefined as unknown as [number, number],
    });
    const vm = wrapper.vm as unknown as { mapBounds: null };
    expect(vm.mapBounds).toBeNull();
  });

  // ── start_date_local display ──────────────────────────────────────────────

  it("shows formatted start date when expanded", async () => {
    const wrapper = await mountExpanded({ start_date_local: "2024-06-15T07:30:00" });
    expect(wrapper.find(".accordion-content").text()).toContain("2024");
  });

  it("does not crash when start_date_local is missing", async () => {
    const wrapper = await mountExpanded({ start_date_local: undefined });
    expect(wrapper.find(".accordion-content").exists()).toBe(true);
  });

  // ── Custom mapHeight prop ─────────────────────────────────────────────────

  it("applies custom mapHeight to the map container", async () => {
    const wrapper = mount(StravaRideItem, {
      props: { activity: baseActivity, mapHeight: "600px" },
      global: { stubs: { Transition: TransitionStub } },
    });
    await flushPromises();
    await wrapper.find(".accordion-header").trigger("click");
    await flushPromises();
    expect(wrapper.find(".map-container").attributes("style")).toContain("600px");
  });
});
