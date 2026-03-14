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

const sampleFlights = [
  {
    date: "2024-01-15",
    time: "08:00",
    origin: "SIN",
    destination: "CGK",
    flightNumber: "SQ-123",
    departureDateTime: "2024-01-15T08:00:00",
    arrivalDateTime: "2024-01-15T09:30:00",
    airline: "Singapore Airlines",
  },
  {
    date: "2024-02-20",
    time: "14:00",
    origin: "SIN",
    destination: "HKG",
    flightNumber: "CX-456",
    departureDateTime: "2024-02-20T14:00:00",
    arrivalDateTime: "2024-02-20T18:00:00",
    airline: "Cathay Pacific",
  },
];

describe("FlightMap", () => {
  it("renders map container after mount", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("renders statistics panel with labels", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const html = wrapper.html();
    expect(html).toContain("Flight Statistics");
    expect(html).toContain("Total Flights");
    expect(html).toContain("Unique Routes");
    expect(html).toContain("Airports");
    expect(html).toContain("Countries");
  });

  it("renders legend panel", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".legend-panel").exists()).toBe(true);
    expect(wrapper.text()).toContain("Flight Routes");
  });

  it("applies custom height", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights, height: "500px" },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const container = wrapper.find(".flight-map-container");
    expect(container.attributes("style")).toContain("height: 500px");
  });

  it("handles empty flights gracefully", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: [] },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".flight-map-container").exists()).toBe(true);
  });

  it("does not show route details modal initially", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".modal-overlay").exists()).toBe(false);
  });

  it("renders stats panel with toggle button on mobile class", async () => {
    const wrapper = mount(FlightMap, {
      props: { flights: sampleFlights },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".stats-panel").exists()).toBe(true);
  });
});
