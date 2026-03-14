import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import StravaRideVisualizer from "../StravaRideVisualizer.vue";

const StravaRideItemStub = defineComponent({
  props: {
    activity: { type: Object, default: null },
    mapHeight: { type: String, default: undefined },
  },
  setup(props) {
    const name = (props.activity as { name?: string } | null)?.name ?? "";
    return () => h("div", { class: "strava-ride-stub", "data-name": name }, name);
  },
});

const sampleActivity = {
  name: "Morning Ride",
  type: "Ride",
  distance: 25000,
  moving_time: 3600,
  elapsed_time: 4000,
  total_elevation_gain: 200,
  average_speed: 6.94,
  max_speed: 12.5,
  start_latlng: [1.35, 103.85] as [number, number],
  end_latlng: [1.36, 103.86] as [number, number],
};

describe("StravaRideVisualizer", () => {
  it("shows loading spinner before client mount", () => {
    const wrapper = mount(StravaRideVisualizer, {
      global: { stubs: { StravaRideItem: StravaRideItemStub } },
      props: { activities: [sampleActivity] },
    });
    const loadingEl = wrapper.find(".strava-rides-container");
    expect(loadingEl.exists()).toBe(true);
  });

  it("shows empty state when no activities provided", async () => {
    const wrapper = mount(StravaRideVisualizer, {
      global: { stubs: { StravaRideItem: StravaRideItemStub } },
      props: { activities: [] },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("No ride data available");
  });

  it("renders StravaRideItem for each activity", async () => {
    const activities = [sampleActivity, { ...sampleActivity, name: "Afternoon Ride" }];
    const wrapper = mount(StravaRideVisualizer, {
      global: { stubs: { StravaRideItem: StravaRideItemStub } },
      props: { activities },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const items = wrapper.findAll(".strava-ride-stub");
    expect(items).toHaveLength(2);
    expect(items[0].text()).toBe("Morning Ride");
    expect(items[1].text()).toBe("Afternoon Ride");
  });

  it("supports single activity prop", async () => {
    const wrapper = mount(StravaRideVisualizer, {
      global: { stubs: { StravaRideItem: StravaRideItemStub } },
      props: { activity: sampleActivity },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const items = wrapper.findAll(".strava-ride-stub");
    expect(items).toHaveLength(1);
  });

  it("passes height prop down to StravaRideItem", async () => {
    const wrapper = mount(StravaRideVisualizer, {
      global: { stubs: { StravaRideItem: StravaRideItemStub } },
      props: { activities: [sampleActivity], height: "800px" },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const item = wrapper.findComponent(StravaRideItemStub);
    expect(item.props("mapHeight")).toBe("800px");
  });
});
