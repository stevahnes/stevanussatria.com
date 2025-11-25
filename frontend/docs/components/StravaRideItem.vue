<script setup lang="ts">
import {
  LMap,
  LTileLayer,
  LPolyline,
  LMarker,
  LPopup,
  LControlZoom,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { ref, computed, onMounted, nextTick } from "vue";
import { useData } from "vitepress";
import type { Map as LeafletMap } from "leaflet";
import type * as LeafletTypes from "leaflet";

interface StravaActivity {
  type: string;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_watts?: number | null;
  kilojoules?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  average_speed: number;
  max_speed: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  map?: {
    polyline?: string;
    summary_polyline?: string;
  };
  start_date?: string;
  start_date_local?: string;
}

const props = defineProps<{
  activity: StravaActivity;
  mapHeight?: string;
}>();

// Polyline decoder
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }

  return coordinates;
}

const { isDark } = useData();
const isExpanded = ref(false);
const L = ref<typeof LeafletTypes | null>(null);
const isLeafletLoaded = ref<boolean>(false);
const mapRef = ref<{ leafletObject: LeafletMap } | null>(null);
const isMapReady = ref<boolean>(false);
const currentZoom = ref<number>(13);
const clientSideTheme = ref(false);
const isClient = ref(false);

const TILE_CONFIG = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

const tileConfig = computed(() =>
  clientSideTheme.value && isDark.value ? TILE_CONFIG.dark : TILE_CONFIG.light,
);

const routeCoordinates = computed<[number, number][]>(() => {
  const polyline = props.activity.map?.polyline || props.activity.map?.summary_polyline;
  if (!polyline) {
    if (props.activity.start_latlng && props.activity.end_latlng) {
      return [props.activity.start_latlng, props.activity.end_latlng];
    }
    return [];
  }

  try {
    return decodePolyline(polyline);
  } catch (error) {
    console.error("Failed to decode polyline:", error);
    return [];
  }
});

const mapBounds = computed<[[number, number], [number, number]] | null>(() => {
  if (routeCoordinates.value.length === 0) return null;

  const lats = routeCoordinates.value.map(coord => coord[0]);
  const lngs = routeCoordinates.value.map(coord => coord[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;

  return [
    [minLat - latPadding, minLng - lngPadding],
    [maxLat + latPadding, maxLng + lngPadding],
  ];
});

const mapCenter = computed<[number, number]>(() => {
  if (props.activity.start_latlng) {
    return props.activity.start_latlng;
  }
  if (routeCoordinates.value.length > 0) {
    const midIndex = Math.floor(routeCoordinates.value.length / 2);
    return routeCoordinates.value[midIndex];
  }
  return [1.35, 103.85];
});

const routeColor = computed<string>(() =>
  clientSideTheme.value && isDark.value ? "#10b981" : "#059669",
);

const createMarkerIcon = (
  isStart: boolean,
  isDarkMode: boolean,
): LeafletTypes.Icon<LeafletTypes.IconOptions> | null => {
  if (!L.value || !isLeafletLoaded.value) return null;

  const color = isStart ? (isDarkMode ? "#10b981" : "#059669") : isDarkMode ? "#ef4444" : "#dc2626";

  return L.value.divIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${isStart ? "S" : "E"}</text>
      </svg>
    `,
    className: "custom-marker-icon",
    iconSize: [24, 24] as [number, number],
    iconAnchor: [12, 12] as [number, number],
  }) as LeafletTypes.Icon<LeafletTypes.IconOptions>;
};

const startIcon = computed(() => createMarkerIcon(true, clientSideTheme.value && isDark.value));
const endIcon = computed(() => createMarkerIcon(false, clientSideTheme.value && isDark.value));

const onMapReady = async (): Promise<void> => {
  isMapReady.value = true;
  await nextTick();

  if (!mapRef.value?.leafletObject) return;

  const map = mapRef.value.leafletObject as LeafletMap;

  map.setMinZoom(3);
  map.setMaxZoom(18);

  if (mapBounds.value) {
    map.fitBounds(mapBounds.value, {
      padding: [20, 20],
      animate: false,
    });
  } else {
    map.setView(mapCenter.value, 13, { animate: false });
  }

  if (map.options) {
    Object.assign(map.options, {
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
      preferCanvas: true,
    });
  }

  map.on("zoom", () => {
    currentZoom.value = map.getZoom();
  });
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

const formatElevation = (meters: number): string => {
  return `${meters.toFixed(0)} m`;
};

const formatPower = (watts: number | null | undefined): string => {
  if (watts === null || watts === undefined) return "N/A";
  return `${watts.toFixed(0)} W`;
};

const formatEnergy = (kj: number | null | undefined): string => {
  if (kj === null || kj === undefined) return "N/A";
  return `${kj.toFixed(0)} kJ`;
};

const formatHeartRate = (bpm: number | null | undefined): string => {
  if (bpm === null || bpm === undefined) return "N/A";
  return `${Math.round(bpm)} bpm`;
};

onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;

  if (typeof window !== "undefined") {
    try {
      const leafletModule = await import("leaflet");
      L.value = leafletModule.default || leafletModule;
      isLeafletLoaded.value = true;
    } catch (error) {
      console.error("Failed to load Leaflet:", error);
    }
  }
});
</script>

<template>
  <div
    class="ride-accordion-item"
    :class="[
      '!border !rounded-lg !transition-all !duration-300 !ease-in-out !overflow-hidden',
      clientSideTheme && isDark
        ? '!bg-gray-900/50 !border-gray-700'
        : '!bg-white/50 !border-gray-200',
    ]"
  >
    <!-- Accordion Header (Summary) -->
    <button
      class="accordion-header !w-full !text-left !p-3 md:!p-4 !flex !items-center !justify-between !cursor-pointer !transition-colors"
      :class="clientSideTheme && isDark ? 'hover:!bg-gray-800/50' : 'hover:!bg-gray-50/50'"
      @click="isExpanded = !isExpanded"
    >
      <div class="!flex-1 !min-w-0 !pr-2">
        <h3
          class="!text-sm md:!text-base !font-bold !mt-0 !mb-2 !flex !items-center !gap-2"
          :class="
            clientSideTheme && isDark
              ? '!text-transparent !bg-clip-text !bg-gradient-to-r !from-green-400 !to-emerald-400'
              : '!text-transparent !bg-clip-text !bg-gradient-to-r !from-green-600 !to-emerald-600'
          "
        >
          <!-- E-Bike Icon -->
          <svg
            v-if="activity.type === 'EBikeRide'"
            class="!w-4 !h-4 md:!w-5 md:!h-5 !flex-shrink-0"
            :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.75 5 L0.75 9 3.5 9 L1.5 13"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="currentColor"
            />
            <circle cx="7.2" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="19.2" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />
            <path
              d="M7.2 15 L11.2 8.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.2 8.5 L16.2 8.5 M11.2 8.5 L15.2 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.2 8.5 L11.2 5.5 M10.2 5.5 L12.2 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M16.2 8.5 L19.2 15 M16.2 8.5 L16.2 6 M15.2 6 L17.2 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15.2 15 L19.2 15 M7.2 15 L11.2 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>

          <!-- Regular Bike Icon -->
          <svg
            v-else-if="activity.type === 'Ride'"
            class="!w-4 !h-4 md:!w-5 md:!h-5 !flex-shrink-0"
            :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="18" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />
            <path
              d="M6 15 L10 8.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10 8.5 L15 8.5 M10 8.5 L14 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10 8.5 L10 5.5 M9 5.5 L11 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 8.5 L18 15 M15 8.5 L15 6 M14 6 L16 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14 15 L18 15 M6 15 L10 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>

          <!-- Hiking Boots Icon -->
          <svg
            v-else-if="activity.type === 'Hike'"
            class="!w-4 !h-4 md:!w-5 md:!h-5 !flex-shrink-0"
            :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 225 225"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M164 170C175.387 166.117 184.139 157.784 187.359 146C189.142 139.475 189.221 132.002 180.996 130.279C172.578 128.515 166.118 131.899 159 135.769C155.834 137.491 151.011 141.523 147.148 140.292C142.224 138.722 144 128.932 144 125C140.058 127.186 131.118 134.848 127.028 129.343C124.737 126.261 126 119.654 126 116C122.297 118.054 112.786 126.197 109.603 119.605C107.865 116.004 109 109.913 109 106L109 79C109 73.0065 109.436 67.2627 106.03 62.0039C104.907 60.2699 103.559 58.7038 101.957 57.3943C100.786 56.4378 99.4345 55.521 98 55.0093C86.2003 50.7997 85.203 62.7183 77.8951 68.0347C68.9321 74.5551 56.1683 77.0897 49.9946 87.0008C47.1738 91.5292 46.952 96.8904 46 102C54.6289 96.3093 64.0025 91.6593 73 86.5756C82.4715 81.2242 91.9506 75.185 102 71C101.964 81.1223 95.0042 82.9019 87 87.4244C75.0287 94.1882 60.7355 99.8602 50.0401 108.529C39.021 117.461 40.2701 134.36 37 147L105 147C114.272 147 124.793 144.083 129 154L36 154C36.1167 167.916 44.7158 171 57 171C53.9517 179.213 45.0799 180.044 38.0039 175.297C32.7782 171.791 29.834 166.164 29.1736 160C28.3998 152.776 30.2201 145.059 31.5401 138C33.7889 125.973 35.9484 113.961 38.5756 102C40.219 94.518 40.6488 86.2577 45.5324 80.0147C52.0807 71.6435 63.3438 68.3942 71.9568 62.6759C76.3923 59.7311 77.5755 54.8286 81.213 51.2137C86.613 45.8473 96.4399 45.7187 103 49C125.412 60.2104 106.322 88.2053 127 99.6875C135.55 104.435 144.398 108.656 153 113.309C158.757 116.422 164.651 120.561 171 122.363C180.817 125.149 192.579 121.271 195.606 135C198.13 146.45 190.502 161.427 181.985 168.532C176.327 173.254 167.776 179.424 164 170 M116 102L116 113C119.638 111.432 123.006 109.601 126 107C122.755 105.088 119.539 103.288 116 102 M133 111L133 123C136.857 121.197 140.232 119.253 143 116L133 111 M151 121L151 132C154.735 130.256 158.716 128.498 161 125L151 121 M122 178C116.346 178 110.213 178.765 105 176.16C101.055 174.19 97.527 169.075 93 168.662C87.9327 168.199 83.4164 174.553 79 176.467C73.4842 178.857 66.8708 178 61 178C63.5157 169.63 68.4161 172.654 75 169.991C79.2035 168.291 81.9821 164.459 86 162.457C95.7364 157.605 101.21 165.93 109 169.683C115.207 172.674 120.433 169.452 122 178 M141 178C134.413 178 128.569 178.685 127 171C133.863 171 139.527 169.961 141 178 M158 171L161 178C153.95 178 147.538 179.39 146 171L158 171z"
            />
          </svg>

          <span class="!truncate">{{ activity.name }}</span>
        </h3>
        <div
          class="!grid !grid-cols-2 md:!grid-cols-3 lg:!grid-cols-6 !gap-x-2 !gap-y-1.5 !text-xs"
        >
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">Time:</span>
            <span class="!ml-1">{{ formatTime(activity.moving_time) }}</span>
          </div>
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">Distance:</span>
            <span class="!ml-1">{{ formatDistance(activity.distance) }}</span>
          </div>
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">Avg Speed:</span>
            <span class="!ml-1">{{ formatSpeed(activity.average_speed) }}</span>
          </div>
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">Power:</span>
            <span class="!ml-1">{{ formatPower(activity.average_watts) }}</span>
          </div>
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">HR:</span>
            <span class="!ml-1">{{ formatHeartRate(activity.average_heartrate) }}</span>
          </div>
          <div class="summary-stat">
            <span class="!font-semibold !opacity-75">Energy:</span>
            <span class="!ml-1">{{ formatEnergy(activity.kilojoules) }}</span>
          </div>
        </div>
      </div>
      <svg
        class="!w-4 !h-4 md:!w-5 md:!h-5 !ml-2 !flex-shrink-0 !transition-transform !duration-300"
        :class="isExpanded ? '!rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Accordion Content (Full Details + Map) -->
    <Transition name="accordion">
      <div v-if="isExpanded" class="accordion-content !overflow-hidden">
        <div class="!p-3 md:!p-4 !space-y-3 md:!space-y-4">
          <!-- Full Statistics -->
          <div
            class="stats-panel"
            :class="[
              '!border !shadow-lg !rounded-lg !p-3 md:!p-4',
              clientSideTheme && isDark
                ? '!bg-gray-900/95 !text-gray-100 !border-gray-600'
                : '!bg-white/95 !text-gray-800 !border-gray-300',
            ]"
          >
            <div class="!mb-2 md:!mb-3">
              <h4
                class="!text-xs md:!text-sm !font-bold !mt-0 !mb-1"
                :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'"
              >
                Ride Details
              </h4>
              <p v-if="activity.start_date_local" class="!text-xs !opacity-75">
                {{
                  new Date(activity.start_date_local).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </p>
            </div>

            <div
              class="stats-grid !grid !grid-cols-2 md:!grid-cols-5 !gap-2 md:!gap-3 !text-xs md:!text-sm"
            >
              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-blue-400' : '!text-blue-600'"
                >
                  {{ formatTime(activity.elapsed_time) }}
                </div>
                <div class="!text-xs !opacity-75">Total Time</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
                >
                  {{ formatTime(activity.moving_time) }}
                </div>
                <div class="!text-xs !opacity-75">Moving Time</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-purple-400' : '!text-purple-600'"
                >
                  {{ formatDistance(activity.distance) }}
                </div>
                <div class="!text-xs !opacity-75">Distance</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-orange-400' : '!text-orange-600'"
                >
                  {{ formatElevation(activity.total_elevation_gain) }}
                </div>
                <div class="!text-xs !opacity-75">Elevation</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-cyan-400' : '!text-cyan-600'"
                >
                  {{ formatSpeed(activity.average_speed) }}
                </div>
                <div class="!text-xs !opacity-75">Avg Speed</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-red-400' : '!text-red-600'"
                >
                  {{ formatSpeed(activity.max_speed) }}
                </div>
                <div class="!text-xs !opacity-75">Max Speed</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-yellow-400' : '!text-yellow-600'"
                >
                  {{ formatPower(activity.average_watts) }}
                </div>
                <div class="!text-xs !opacity-75">Avg Power</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-pink-400' : '!text-pink-600'"
                >
                  {{ formatEnergy(activity.kilojoules) }}
                </div>
                <div class="!text-xs !opacity-75">Energy</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-rose-400' : '!text-rose-600'"
                >
                  {{ formatHeartRate(activity.average_heartrate) }}
                </div>
                <div class="!text-xs !opacity-75">Avg HR</div>
              </div>

              <div class="stat-item">
                <div
                  class="!text-base md:!text-lg !font-bold !mb-0.5 md:!mb-1"
                  :class="clientSideTheme && isDark ? '!text-indigo-400' : '!text-indigo-600'"
                >
                  {{ formatHeartRate(activity.max_heartrate) }}
                </div>
                <div class="!text-xs !opacity-75">Max HR</div>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div v-if="isClient" class="map-container" :style="{ height: mapHeight || '400px' }">
            <LMap
              ref="mapRef"
              :zoom="currentZoom"
              :center="mapCenter"
              :options="{
                zoomControl: false,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                touchZoom: true,
                minZoom: 3,
                maxZoom: 18,
                maxBounds: mapBounds || [
                  [-85, -175],
                  [85, 175],
                ],
                preferCanvas: true,
                zoomAnimation: true,
                fadeAnimation: false,
                markerZoomAnimation: false,
                updateWhenZooming: false,
                updateWhenIdle: true,
              }"
              :class="[
                'map-instance !w-full !h-full !rounded-lg !border',
                clientSideTheme && isDark ? '!border-gray-700' : '!border-gray-200',
              ]"
              @ready="onMapReady"
            >
              <LTileLayer
                :url="tileConfig.url"
                :attribution="tileConfig.attribution"
                :options="{
                  maxZoom: 19,
                  updateWhenZooming: false,
                  updateWhenIdle: true,
                  keepBuffer: 1,
                  maxNativeZoom: 16,
                  reuseTiles: true,
                }"
              />

              <LControlZoom position="topright" />

              <LPolyline
                v-if="isMapReady && routeCoordinates.length > 0"
                :lat-lngs="routeCoordinates"
                :color="routeColor"
                :weight="4"
                :opacity="0.8"
                :options="{
                  className: 'ride-route',
                  smoothFactor: 1.0,
                  noClip: false,
                  interactive: false,
                }"
              />

              <LMarker
                v-if="isMapReady && activity.start_latlng && startIcon"
                :lat-lng="activity.start_latlng"
                :icon="startIcon"
                :options="{
                  className: 'start-marker',
                  interactive: true,
                }"
              >
                <LPopup>
                  <div class="popup-content">
                    <div class="!font-bold !mb-1">Start</div>
                    <div class="!text-xs !opacity-75">
                      {{ activity.start_latlng[0].toFixed(4) }},
                      {{ activity.start_latlng[1].toFixed(4) }}
                    </div>
                  </div>
                </LPopup>
              </LMarker>

              <LMarker
                v-if="isMapReady && activity.end_latlng && endIcon"
                :lat-lng="activity.end_latlng"
                :icon="endIcon"
                :options="{
                  className: 'end-marker',
                  interactive: true,
                }"
              >
                <LPopup>
                  <div class="popup-content">
                    <div class="!font-bold !mb-1">End</div>
                    <div class="!text-xs !opacity-75">
                      {{ activity.end_latlng[0].toFixed(4) }},
                      {{ activity.end_latlng[1].toFixed(4) }}
                    </div>
                  </div>
                </LPopup>
              </LMarker>
            </LMap>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ride-accordion-item {
  transition: all 0.3s ease-in-out;
}

.accordion-header {
  outline: none;
}

.summary-stat {
  display: flex;
  align-items: center;
  white-space: nowrap;
  flex-wrap: wrap;
}

.stats-panel {
  transition: all 0.2s ease-in-out;
}

.stats-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 35px -5px rgb(0 0 0 / 0.15),
    0 10px 10px -5px rgb(0 0 0 / 0.04);
}

.stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

.stat-item {
  text-align: center;
}

.map-container {
  position: relative;
  width: 100%;
  min-height: 300px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.map-instance {
  height: 100%;
  z-index: 1;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 5000px;
  opacity: 1;
}

:deep(.ride-route) {
  cursor: default;
  transition: opacity 0.15s ease-out;
}

:deep(.start-marker),
:deep(.end-marker) {
  cursor: pointer;
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

:deep(.start-marker:hover),
:deep(.end-marker:hover) {
  transform: translate3d(0, -2px, 0) scale(1.1);
}

:deep(.leaflet-popup-content-wrapper) {
  background: var(--vp-c-bg) !important;
  border-color: var(--vp-c-border) !important;
  border-radius: 0.75rem !important;
  padding: 0.75rem !important;
  box-shadow:
    0 10px 25px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -2px rgb(0 0 0 / 0.05) !important;
  backdrop-filter: blur(12px) !important;
  border-width: 1px !important;
}

:deep(.leaflet-popup-content) {
  margin: 0 !important;
  font-family: inherit !important;
}

:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
}

:deep(.leaflet-control-zoom a) {
  background: var(--vp-c-bg) !important;
  border-color: var(--vp-c-border) !important;
  transition: background-color 0.15s ease;
}

:deep(.leaflet-control-zoom a:hover) {
  background: var(--vp-c-bg-soft) !important;
}

@media (max-width: 768px) {
  .accordion-header {
    padding: 0.75rem;
  }

  .summary-stat {
    font-size: 0.7rem;
    line-height: 1.3;
  }

  .summary-stat span:first-child {
    font-size: 0.65rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.75rem !important;
  }

  .stat-item {
    font-size: 0.75rem;
  }

  .map-container {
    min-height: 300px;
  }

  .stats-panel {
    padding: 0.75rem !important;
  }
}

@media (max-width: 480px) {
  .accordion-header {
    padding: 0.625rem;
  }

  .summary-stat {
    font-size: 0.65rem;
  }

  .summary-stat span:first-child {
    font-size: 0.6rem;
  }

  .stats-grid {
    gap: 0.5rem !important;
  }

  .map-container {
    min-height: 250px;
  }
}
</style>
