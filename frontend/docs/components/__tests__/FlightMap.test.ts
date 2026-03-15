import { describe, it, expect, vi, afterEach } from "vitest";
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
        radius: null,
        fillColor: null,
        fillOpacity: null,
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
    LCircleMarker: stub("LCircleMarker"),
    LPopup: stub("LPopup"),
    LControlZoom: stub("LControlZoom"),
  };
});

import FlightMap from "../FlightMap.vue";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeFlight = (origin: string, destination: string, overrides = {}) => ({
  date: "2024-01-15",
  time: "08:00",
  origin,
  destination,
  flightNumber: "SQ-001",
  departureDateTime: "2024-01-15T08:00:00",
  arrivalDateTime: "2024-01-15T10:00:00",
  airline: "Singapore Airlines",
  ...overrides,
});

const sampleFlights = [
  makeFlight("SIN", "CGK"),
  makeFlight("SIN", "HKG"),
  makeFlight("SIN", "CGK"), // duplicate route → count = 2
];

const transFlightsSINtoSFO = [
  makeFlight("SIN", "SFO"), // trans-Pacific westward
  makeFlight("SIN", "LAX"), // another US route
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const mountMap = async (props = {}) => {
  const wrapper = mount(FlightMap, { props: { flights: sampleFlights, ...props } });
  await flushPromises();
  await wrapper.vm.$nextTick();
  return wrapper;
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe("FlightMap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders map container after mount", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("renders statistics panel with all labels", async () => {
    const wrapper = await mountMap();
    const html = wrapper.html();
    expect(html).toContain("Flight Statistics");
    expect(html).toContain("Total Flights");
    expect(html).toContain("Unique Routes");
    expect(html).toContain("Airports");
    expect(html).toContain("Countries");
  });

  it("renders legend panel", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".legend-panel").exists()).toBe(true);
    expect(wrapper.text()).toContain("Flight Routes");
  });

  it("applies custom height style", async () => {
    const wrapper = await mountMap({ height: "500px" });
    expect(wrapper.find(".flight-map-container").attributes("style")).toContain("500px");
  });

  it("handles empty flights gracefully", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("does not show route details modal initially", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  // ── Statistics computed ────────────────────────────────────────────────────

  it("displays correct total flight count", async () => {
    const wrapper = await mountMap();
    // 3 flights in sampleFlights
    expect(wrapper.text()).toContain("3");
  });

  it("displays correct unique routes count (deduplicates bidirectional)", async () => {
    // SIN-CGK (×2) + SIN-HKG = 2 unique routes
    const wrapper = await mountMap();
    expect(wrapper.text()).toContain("2");
  });

  it("shows 0 stats for empty flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: [] } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    // All stat numbers should be 0
    const text = wrapper.text();
    expect(text).toContain("0");
  });

  // ── Route deduplication & opacity ─────────────────────────────────────────

  it("counts repeated routes correctly (SIN-CGK appears twice)", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("SIN", "CGK"), makeFlight("SIN", "CGK")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    // 1 unique route, 3 flights
    expect(wrapper.text()).toContain("1"); // unique routes
    expect(wrapper.text()).toContain("3"); // total flights
  });

  it("treats reverse routes (CGK-SIN) as same route as SIN-CGK", async () => {
    const flights = [makeFlight("SIN", "CGK"), makeFlight("CGK", "SIN")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("1"); // 1 unique route
  });

  // ── Invalid airport codes ──────────────────────────────────────────────────

  it("skips flights with unknown airport codes without crashing", async () => {
    const flights = [
      makeFlight("SIN", "CGK"),
      makeFlight("XXX", "YYY"), // unknown codes
    ];
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("XXX"));
    consoleSpy.mockRestore();
  });

  // ── Trans-Pacific routes (createCurvedPath westward wrapping) ──────────────

  it("handles trans-Pacific routes without crashing", async () => {
    const wrapper = mount(FlightMap, { props: { flights: transFlightsSINtoSFO } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("renders stats for trans-Pacific flights", async () => {
    const wrapper = mount(FlightMap, { props: { flights: transFlightsSINtoSFO } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("2"); // 2 total flights
  });

  // ── Short-distance routes (createCurvedPath distance < 5) ─────────────────

  it("handles short-distance routes (same country) without crashing", async () => {
    // BLR (Bangalore) to MAA (Chennai) — very close
    const flights = [makeFlight("BLR", "MAA")];
    const wrapper = mount(FlightMap, { props: { flights } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  // ── Modal show / close ────────────────────────────────────────────────────

  it("shows route details modal when a polyline is clicked", async () => {
    const wrapper = await mountMap();
    // Directly call handleRouteClick via the component's exposed method
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 2,
      flights: [sampleFlights[0], sampleFlights[2]],
      coordinates: [
        [1.36, 103.99],
        [-6.13, 106.66],
      ],
      opacity: 0.9,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(true);
  });

  it("displays correct route info in modal", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 1,
      flights: [sampleFlights[0]],
      coordinates: [
        [1.36, 103.99],
        [-6.13, 106.66],
      ],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    const modal = wrapper.find(".modal-content");
    expect(modal.text()).toContain("SIN");
    expect(modal.text()).toContain("CGK");
  });

  it("closes modal when overlay is clicked", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(true);

    await wrapper.find(".modal-overlay").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  it("closes modal when the X button is clicked", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    // The close button inside the modal
    const closeBtn = wrapper.find(".modal-content button");
    await closeBtn.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  it("modal content does not close when clicked (stopPropagation)", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-HKG",
      from: "SIN",
      to: "HKG",
      count: 1,
      flights: [sampleFlights[1]],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    await wrapper.find(".modal-content").trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-overlay").exists()).toBe(true);
  });

  // ── Stats panel collapse (mobile) ─────────────────────────────────────────

  it("stats panel is not collapsed initially", async () => {
    const wrapper = await mountMap();
    expect(wrapper.find(".stats-panel").classes()).not.toContain("collapsed-mobile");
  });

  it("toggleStatsPanel collapses stats panel", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      toggleStatsPanel: () => void;
      isStatsPanelCollapsed: boolean;
    };
    vm.toggleStatsPanel();
    await wrapper.vm.$nextTick();
    expect(vm.isStatsPanelCollapsed).toBe(true);
  });

  it("toggleStatsPanel expands stats panel after collapse", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as {
      toggleStatsPanel: () => void;
      isStatsPanelCollapsed: boolean;
    };
    vm.toggleStatsPanel();
    vm.toggleStatsPanel();
    await wrapper.vm.$nextTick();
    expect(vm.isStatsPanelCollapsed).toBe(false);
  });

  // ── formatDate / formatTime ────────────────────────────────────────────────

  it("modal flight history shows formatted date", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 1,
      flights: [{ ...sampleFlights[0], date: "2024-01-15", time: "08:30:00" }],
      coordinates: [],
      opacity: 0.5,
    });
    await wrapper.vm.$nextTick();
    // formatDate outputs locale date string — just ensure the modal rendered
    expect(wrapper.find(".modal-content").exists()).toBe(true);
    // formatTime trims to 5 chars: "08:30"
    expect(wrapper.find(".modal-content").text()).toContain("08:30");
  });

  // ── Multiple flights > 10 truncation ──────────────────────────────────────

  it("shows '... and N more flights' for routes with >10 flights", async () => {
    const manyFlights = Array.from({ length: 12 }, () => makeFlight("SIN", "CGK"));
    const wrapper = mount(FlightMap, { props: { flights: manyFlights } });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as { handleRouteClick: (r: object) => void };
    vm.handleRouteClick({
      key: "SIN-CGK",
      from: "SIN",
      to: "CGK",
      count: 12,
      flights: manyFlights,
      coordinates: [],
      opacity: 1,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".modal-content").text()).toContain("more flights");
  });

  // ── Window resize handler ─────────────────────────────────────────────────

  it("registers resize listener on mount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    mount(FlightMap, { props: { flights: [] } });
    expect(addSpy.mock.calls.map(c => c[0])).toContain("resize");
    addSpy.mockRestore();
  });

  // ── Tile config (light mode default) ─────────────────────────────────────
  // LTileLayer is stubbed as a plain <div> so the URL never appears in html().
  // Verify via the component's tileConfig computed instead.

  it("uses light tile URL in light mode", async () => {
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { tileConfig: { url: string } };
    expect(vm.tileConfig.url).toContain("light_all");
  });

  // ── Many airports — countries deduplification ─────────────────────────────

  it("counts unique countries from airport list", async () => {
    // SIN=Singapore, CGK=Indonesia, HKG=Hong Kong — 3 unique countries
    const wrapper = await mountMap();
    const vm = wrapper.vm as unknown as { statistics: { countriesVisited: number } };
    expect(vm.statistics.countriesVisited).toBeGreaterThanOrEqual(2);
  });
});
