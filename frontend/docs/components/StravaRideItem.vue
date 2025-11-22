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
          <svg
            class="!w-4 !h-4 md:!w-5 md:!h-5 !flex-shrink-0"
            :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Rear wheel - bigger -->
            <circle cx="6" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />

            <!-- Front wheel - bigger -->
            <circle cx="18" cy="15" r="4" stroke="currentColor" stroke-width="1.5" fill="none" />

            <!-- Frame - rear triangle (shorter) -->
            <path
              d="M6 15 L10 8.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Frame - top tube and down tube (shorter, more compact) -->
            <path
              d="M10 8.5 L15 8.5 M10 8.5 L14 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Seat post and saddle -->
            <path
              d="M10 8.5 L10 5.5 M9 5.5 L11 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Front fork and handlebars -->
            <path
              d="M15 8.5 L18 15 M15 8.5 L15 6 M14 6 L16 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Chain stays connecting to wheels -->
            <path
              d="M14 15 L18 15 M6 15 L10 15"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
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
