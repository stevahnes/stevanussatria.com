<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import StravaRideItem from "./StravaRideItem.vue";

// --- Types ---
interface StravaActivity {
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_watts?: number | null;
  kilojoules?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  average_speed: number; // m/s
  max_speed: number; // m/s
  start_latlng: [number, number];
  end_latlng: [number, number];
  map?: {
    polyline?: string;
    summary_polyline?: string;
  };
  start_date?: string;
  start_date_local?: string;
}

interface Props {
  activity?: StravaActivity;
  activities?: StravaActivity[];
  height?: string;
}

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  activity: undefined,
  activities: () => [],
  height: "600px",
});

// Get all activities
const allActivities = computed<StravaActivity[]>(() => {
  if (props.activity) return [props.activity];
  if (props.activities && props.activities.length > 0) return props.activities;
  return [];
});

// --- Main Component State ---
const isClient = ref(false);

onMounted(() => {
  isClient.value = true;
});
</script>

<template>
  <div v-if="isClient" class="strava-rides-container">
    <div v-if="allActivities.length === 0" class="!text-center !p-8 !text-gray-500">
      No ride data available.
    </div>

    <div v-else class="!space-y-4">
      <StravaRideItem
        v-for="(ride, index) in allActivities"
        :key="index"
        :activity="ride"
        :map-height="height"
      />
    </div>
  </div>

  <div
    v-else
    class="strava-rides-container !flex !items-center !justify-center !bg-gray-100 dark:!bg-gray-800 !min-h-[200px]"
  >
    <div class="!text-center !p-8">
      <div
        class="!w-8 !h-8 !border-4 !border-green-600 !border-t-transparent !rounded-full !animate-spin !mx-auto !mb-4"
      ></div>
      <p class="!text-gray-600 dark:!text-gray-400">Loading ride data...</p>
    </div>
  </div>
</template>

<style scoped>
.strava-rides-container {
  width: 100%;
}
</style>
