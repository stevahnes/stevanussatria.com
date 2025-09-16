<script setup lang="ts">
import {
  LMap,
  LTileLayer,
  LPolyline,
  LMarker,
  LCircleMarker,
  LPopup,
  LControlZoom,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useData } from "vitepress";
import type { Map as LeafletMap } from "leaflet";
import type * as LeafletTypes from "leaflet";

// --- Types ---
interface FlightData {
  date: string;
  time: string;
  origin: string;
  destination: string;
  flightNumber: string;
  departureDateTime: string;
  arrivalDateTime: string;
  airline: string;
  aircraft?: string | null;
  class?: string | null;
  seat?: string | null;
}

interface Route {
  key: string;
  from: string;
  to: string;
  count: number;
  flights: FlightData[];
  coordinates: [number, number][];
  opacity: number;
}

interface Airport {
  code: string;
  displayCode: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
  flightCount: number;
}

interface Props {
  flights?: FlightData[];
  height?: string;
}

interface MapRef {
  leafletObject: LeafletMap;
}

interface Statistics {
  totalFlights: number;
  uniqueRoutes: number;
  airportsVisited: number;
  countriesVisited: number;
}

interface ZoomLevels {
  minZoom: number;
  maxZoom: number;
  initialZoom: number;
}

// --- Constants ---
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

const AIRPORT_COORDINATES: Record<string, Omit<Airport, "flightCount" | "displayCode">> = {
  SIN: {
    code: "SIN",
    lat: 1.3644,
    lng: 103.9915,
    name: "Singapore Changi Airport",
    city: "Singapore",
    country: "Singapore",
  },
  CGK: {
    code: "CGK",
    lat: -6.1256,
    lng: 106.6559,
    name: "Soekarno-Hatta International Airport",
    city: "Jakarta",
    country: "Indonesia",
  },
  BOS: {
    code: "BOS",
    lat: 42.3656,
    lng: -71.0096,
    name: "Logan International Airport",
    city: "Boston",
    country: "USA",
  },
  SFO: {
    code: "SFO",
    lat: 37.6213,
    lng: -122.379,
    name: "San Francisco International Airport",
    city: "San Francisco",
    country: "USA",
  },
  DXB: {
    code: "DXB",
    lat: 25.2532,
    lng: 55.3657,
    name: "Dubai International Airport",
    city: "Dubai",
    country: "UAE",
  },
  HKG: {
    code: "HKG",
    lat: 22.308,
    lng: 113.9185,
    name: "Hong Kong International Airport",
    city: "Hong Kong",
    country: "Hong Kong",
  },
  IST: {
    code: "IST",
    lat: 41.2619,
    lng: 28.7411,
    name: "Istanbul Airport",
    city: "Istanbul",
    country: "Turkey",
  },
  NCE: {
    code: "NCE",
    lat: 43.6584,
    lng: 7.2159,
    name: "Nice Côte d'Azur Airport",
    city: "Nice",
    country: "France",
  },
  LAX: {
    code: "LAX",
    lat: 33.9425,
    lng: -118.4081,
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "USA",
  },
  BLR: {
    code: "BLR",
    lat: 12.9491,
    lng: 77.6678,
    name: "Kempegowda International Airport",
    city: "Bangalore",
    country: "India",
  },
  MAA: {
    code: "MAA",
    lat: 12.9941,
    lng: 80.1709,
    name: "Chennai International Airport",
    city: "Chennai",
    country: "India",
  },
  KNO: {
    code: "KNO",
    lat: 3.6422,
    lng: 98.8853,
    name: "Kualanamu International Airport",
    city: "Medan",
    country: "Indonesia",
  },
  BKK: {
    code: "BKK",
    lat: 13.69,
    lng: 100.7501,
    name: "Suvarnabhumi Airport",
    city: "Bangkok",
    country: "Thailand",
  },
  PEN: {
    code: "PEN",
    lat: 5.2971,
    lng: 100.2777,
    name: "Penang International Airport",
    city: "Penang",
    country: "Malaysia",
  },
  ICN: {
    code: "ICN",
    lat: 37.4602,
    lng: 126.4407,
    name: "Incheon International Airport",
    city: "Seoul",
    country: "South Korea",
  },
  TPA: {
    code: "TPA",
    lat: 27.9755,
    lng: -82.5332,
    name: "Tampa International Airport",
    city: "Tampa",
    country: "USA",
  },
  ATL: {
    code: "ATL",
    lat: 33.6407,
    lng: -84.4277,
    name: "Hartsfield-Jackson Atlanta International Airport",
    city: "Atlanta",
    country: "USA",
  },
  GRU: {
    code: "GRU",
    lat: -23.4356,
    lng: -46.4731,
    name: "São Paulo/Guarulhos International Airport",
    city: "São Paulo",
    country: "Brazil",
  },
  FCO: {
    code: "FCO",
    lat: 41.8003,
    lng: 12.2389,
    name: "Leonardo da Vinci International Airport",
    city: "Rome",
    country: "Italy",
  },
  FRA: {
    code: "FRA",
    lat: 50.0379,
    lng: 8.5622,
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
  },
  MUC: {
    code: "MUC",
    lat: 48.3537,
    lng: 11.775,
    name: "Munich Airport",
    city: "Munich",
    country: "Germany",
  },
  CDG: {
    code: "CDG",
    lat: 49.0097,
    lng: 2.5479,
    name: "Charles de Gaulle Airport",
    city: "Paris",
    country: "France",
  },
  TXL: {
    code: "TXL",
    lat: 52.5597,
    lng: 13.2877,
    name: "Berlin Tegel Airport",
    city: "Berlin",
    country: "Germany",
  },
  MXP: {
    code: "MXP",
    lat: 45.6306,
    lng: 8.7281,
    name: "Milan Malpensa Airport",
    city: "Milan",
    country: "Italy",
  },
  AMS: {
    code: "AMS",
    lat: 52.3105,
    lng: 4.7683,
    name: "Amsterdam Airport Schiphol",
    city: "Amsterdam",
    country: "Netherlands",
  },
  GUM: {
    code: "GUM",
    lat: 13.4834,
    lng: 144.796,
    name: "Antonio B. Won Pat International Airport",
    city: "Guam",
    country: "USA",
  },
  HNL: {
    code: "HNL",
    lat: 21.3099,
    lng: -157.8581,
    name: "Daniel K. Inouye International Airport",
    city: "Honolulu",
    country: "USA",
  },
  NRT: {
    code: "NRT",
    lat: 35.7647,
    lng: 140.3864,
    name: "Narita International Airport",
    city: "Tokyo",
    country: "Japan",
  },
  TOY: {
    code: "TOY",
    lat: 36.6483,
    lng: 137.1875,
    name: "Toyama Airport",
    city: "Toyama",
    country: "Japan",
  },
  TPE: {
    code: "TPE",
    lat: 25.0797,
    lng: 121.2342,
    name: "Taiwan Taoyuan International Airport",
    city: "Taipei",
    country: "Taiwan",
  },
  SOF: {
    code: "SOF",
    lat: 42.6967,
    lng: 23.4114,
    name: "Sofia Airport",
    city: "Sofia",
    country: "Bulgaria",
  },
};

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  flights: () => [],
  height: "100%",
});

// --- State ---
const L = ref<typeof LeafletTypes | null>(null);
const isLeafletLoaded = ref<boolean>(false);
const selectedRoute = ref<Route | null>(null);
const showRouteDetails = ref<boolean>(false);
const mapRef = ref<MapRef | null>(null);
const isMapReady = ref<boolean>(false);
const currentZoom = ref<number>(2);
const isZooming = ref<boolean>(false);
const initialZoom = ref<number>(2);
const clientSideTheme = ref(false);
const isClient = ref(false);
const isStatsPanelCollapsed = ref<boolean>(false);
const isMobile = ref<boolean>(false);

// --- Theme & Computed ---
const { isDark } = useData();

const tileConfig = computed(() =>
  clientSideTheme.value && isDark.value ? TILE_CONFIG.dark : TILE_CONFIG.light,
);

const createPinIcon = (isDarkMode: boolean): LeafletTypes.Icon<LeafletTypes.IconOptions> | null => {
  if (!L.value || !isLeafletLoaded.value) return null;

  const color = isDarkMode ? "#f59e0b" : "#d97706";
  const shadowColor = isDarkMode ? "#92400e" : "#78350f";

  return L.value.divIcon({
    html: `
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" fill="${color}" stroke="${shadowColor}" stroke-width="1"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `,
    className: "custom-pin-icon",
    iconSize: [24, 36] as [number, number],
    iconAnchor: [12, 36] as [number, number],
    popupAnchor: [0, -36] as [number, number],
  }) as LeafletTypes.Icon<LeafletTypes.IconOptions>;
};

const pinIcon = computed<LeafletTypes.Icon<LeafletTypes.IconOptions> | null>(() =>
  createPinIcon(clientSideTheme.value && isDark.value),
);

const routeColor = computed<string>(() =>
  clientSideTheme.value && isDark.value ? "#60a5fa" : "#3b82f6",
);

// Fixed curve generation that properly handles trans-Pacific routes
const createCurvedPath = (from: [number, number], to: [number, number]): [number, number][] => {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const eastwardDistance = Math.abs(lng2 - lng1);
  const westwardDistance = 360 - eastwardDistance;
  const shouldGoWestward = westwardDistance < eastwardDistance;

  let adjustedLng1 = lng1;
  let adjustedLng2 = lng2;

  if (shouldGoWestward) {
    // For westward routes, always wrap the more western coordinate eastward
    // to avoid extreme negative values that can't be rendered
    if (lng1 < lng2) {
      // lng1 is more western (e.g., LAX -118 vs ICN +126)
      // Wrap the western coordinate (lng1) eastward
      adjustedLng1 = lng1 + 360;
      // Keep lng2 as is
    } else {
      // lng2 is more western (e.g., SIN +103 vs SFO -122)
      // Wrap the western coordinate (lng2) eastward
      adjustedLng2 = lng2 + 360;
      // Keep lng1 as is
    }
  }

  const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(adjustedLng2 - adjustedLng1, 2));

  if (distance < 5)
    return [
      [lat1, adjustedLng1],
      [lat2, adjustedLng2],
    ];

  const midLat = (lat1 + lat2) / 2;
  const midLng = (adjustedLng1 + adjustedLng2) / 2;
  const curveFactor = Math.min(distance * 0.15, 20);

  let curveOffset = curveFactor;
  if (Math.abs(adjustedLng2 - adjustedLng1) > Math.abs(lat2 - lat1)) {
    curveOffset = midLat > 0 ? curveFactor : -curveFactor;
  } else {
    curveOffset = curveFactor * 0.3;
  }

  const controlLat =
    midLat + (Math.abs(adjustedLng2 - adjustedLng1) > Math.abs(lat2 - lat1) ? curveOffset : 0);
  const controlLng =
    midLng + (Math.abs(adjustedLng2 - adjustedLng1) <= Math.abs(lat2 - lat1) ? curveOffset : 0);

  const segments = Math.max(3, Math.min(Math.floor(distance / 10), 8));
  const points: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    const lat = mt2 * lat1 + 2 * mt * t * controlLat + t2 * lat2;
    const lng = mt2 * adjustedLng1 + 2 * mt * t * controlLng + t2 * adjustedLng2;

    points.push([lat, lng]);
  }

  return points.length > 2
    ? points
    : [
        [lat1, adjustedLng1],
        [lat2, adjustedLng2],
      ];
};

// Memoized routes computation
const routes = computed<Route[]>(() => {
  const routeMap = new Map<string, Route>();

  for (const flight of props.flights) {
    if (!AIRPORT_COORDINATES[flight.origin] || !AIRPORT_COORDINATES[flight.destination]) {
      console.warn(
        `Skipping flight with invalid airport codes: ${flight.origin} -> ${flight.destination}`,
      );
      continue;
    }

    const routeKey = `${flight.origin}-${flight.destination}`;
    const reverseKey = `${flight.destination}-${flight.origin}`;
    const existingRoute = routeMap.get(routeKey) || routeMap.get(reverseKey);

    if (existingRoute) {
      existingRoute.count++;
      existingRoute.flights.push(flight);
    } else {
      const fromAirport = AIRPORT_COORDINATES[flight.origin];
      const toAirport = AIRPORT_COORDINATES[flight.destination];

      routeMap.set(routeKey, {
        key: routeKey,
        from: flight.origin,
        to: flight.destination,
        count: 1,
        flights: [flight],
        coordinates: createCurvedPath(
          [fromAirport.lat, fromAirport.lng],
          [toAirport.lat, toAirport.lng],
        ),
        opacity: 0.4,
      });
    }
  }

  const routeArray = Array.from(routeMap.values());
  const maxCount = Math.max(...routeArray.map(route => route.count), 1);

  return routeArray.map(route => ({
    ...route,
    opacity: Math.min(0.3 + (route.count / maxCount) * 0.7, 1.0),
  }));
});

// Performance-optimized route filtering
const simplifiedRoutes = computed<Route[]>(() => {
  if (isZooming.value || currentZoom.value < 3) {
    return routes.value.filter(route => route.count > 1).slice(0, 20);
  }
  return routes.value;
});

// Optimized airports computation with better filtering
const getAirportBounds = () => {
  if (routes.value.length === 0) return null;

  const routeEndpoints = routes.value.flatMap(route =>
    route.coordinates.length >= 2
      ? [route.coordinates[0], route.coordinates[route.coordinates.length - 1]]
      : [],
  );

  if (routeEndpoints.length === 0) return null;

  const lats = routeEndpoints.map(coord => coord[0]);
  const lngs = routeEndpoints.map(coord => coord[1]);

  const normalLngs = lngs.filter(lng => lng >= -180 && lng <= 180);
  const wrappedLngs = lngs.filter(lng => lng < -180 || lng > 180);

  let minLng: number, maxLng: number;

  if (wrappedLngs.length > 0 && normalLngs.length > 0) {
    minLng = Math.max(Math.min(...normalLngs) - 10, -180);
    maxLng = Math.min(Math.max(...wrappedLngs) + 10, 360);
  } else {
    minLng = Math.min(...lngs);
    maxLng = Math.max(...lngs);
  }

  const latSpread = Math.max(...lats) - Math.min(...lats);
  const latPadding = Math.max(Math.min(latSpread * 0.15, 8), 2);
  const lngPadding = Math.max(Math.min((maxLng - minLng) * 0.05, 5), 2);

  return [
    [Math.min(...lats) - latPadding, minLng - lngPadding],
    [Math.max(...lats) + latPadding, maxLng + lngPadding],
  ] as [[number, number], [number, number]];
};

const mapBounds = computed(() => getAirportBounds());

const airports = computed<Airport[]>(() => {
  const airportMap = new Map<string, Airport>();
  const connectedAirports = new Set<string>();
  const wrappedAirports = new Set<string>();

  // Process flights and identify connections
  for (const flight of props.flights) {
    if (!AIRPORT_COORDINATES[flight.origin] || !AIRPORT_COORDINATES[flight.destination]) continue;

    connectedAirports.add(flight.origin);
    connectedAirports.add(flight.destination);

    const processAirport = (code: string) => {
      if (!AIRPORT_COORDINATES[code]) return;

      const existing = airportMap.get(code);
      if (existing) {
        existing.flightCount++;
      } else {
        airportMap.set(code, {
          ...AIRPORT_COORDINATES[code],
          displayCode: code,
          flightCount: 1,
        });
      }
    };

    processAirport(flight.origin);
    processAirport(flight.destination);

    // Check for wrapped coordinates
    const [, lng1] = [
      AIRPORT_COORDINATES[flight.origin].lat,
      AIRPORT_COORDINATES[flight.origin].lng,
    ];
    const [, lng2] = [
      AIRPORT_COORDINATES[flight.destination].lat,
      AIRPORT_COORDINATES[flight.destination].lng,
    ];

    const eastwardDistance = Math.abs(lng2 - lng1);
    const westwardDistance = 360 - eastwardDistance;

    if (westwardDistance < eastwardDistance) {
      wrappedAirports.add(flight.destination);
      wrappedAirports.add(flight.origin);
    }
  }

  const bounds = mapBounds.value;
  const wrappedAirportData: Airport[] = [];

  if (bounds) {
    const [minLng, maxLng] = [bounds[0][1], bounds[1][1]];

    for (const airportCode of wrappedAirports) {
      const originalAirport = airportMap.get(airportCode);
      if (!originalAirport || !connectedAirports.has(airportCode)) continue;

      const wrappedLng =
        originalAirport.lng < 0 ? originalAirport.lng + 360 : originalAirport.lng - 360;

      if (wrappedLng >= minLng && wrappedLng <= maxLng) {
        wrappedAirportData.push({
          ...originalAirport,
          code: `${originalAirport.code}-wrapped`,
          displayCode: originalAirport.code,
          lng: wrappedLng,
        });
      }
    }
  }

  const filteredOriginalAirports = Array.from(airportMap.values()).filter(airport => {
    if (!connectedAirports.has(airport.code)) return false;

    if (bounds) {
      const [minLng, maxLng] = [bounds[0][1], bounds[1][1]];
      if (airport.lng < minLng || airport.lng > maxLng) return false;

      // FIXED: Don't exclude original airports just because they have wrapped versions
      // Only exclude if the original is outside normal longitude bounds AND wrapped is in bounds
      if (wrappedAirports.has(airport.code)) {
        const wrappedLng = airport.lng < 0 ? airport.lng + 360 : airport.lng - 360;
        // Only exclude original if it's way outside normal range and wrapped version exists in bounds
        if (
          (airport.lng < -200 || airport.lng > 200) &&
          wrappedLng >= minLng &&
          wrappedLng <= maxLng
        ) {
          return false;
        }
      }
    }

    return true;
  });

  return [...filteredOriginalAirports, ...wrappedAirportData];
});

// Performance-optimized airport filtering
const simplifiedAirports = computed<Airport[]>(() => {
  if (isZooming.value) {
    return airports.value.filter(airport => airport.flightCount > 2).slice(0, 15);
  }

  const filters = [
    { minZoom: 0, maxZoom: 3, minFlights: 3, maxAirports: 20 },
    { minZoom: 3, maxZoom: 4, minFlights: 1, maxAirports: 30 },
    { minZoom: 4, maxZoom: Infinity, minFlights: 0, maxAirports: Infinity },
  ];

  const filter = filters.find(f => currentZoom.value >= f.minZoom && currentZoom.value < f.maxZoom);
  if (!filter) return airports.value;

  const filtered = airports.value.filter(airport => airport.flightCount > filter.minFlights);
  return filter.maxAirports === Infinity ? filtered : filtered.slice(0, filter.maxAirports);
});

// Optimized zoom level calculation
const zoomLevels = computed<ZoomLevels>(() => {
  return {
    minZoom: 3,
    maxZoom: 8,
    initialZoom: 4, // Fixed zoom level as requested
  };
});

const statistics = computed<Statistics>(() => ({
  totalFlights: props.flights.length,
  uniqueRoutes: routes.value.length,
  airportsVisited: airports.value.length,
  countriesVisited: new Set(airports.value.map(a => a.country)).size,
}));

// --- Event Handlers ---
const handleRouteClick = (route: Route): void => {
  selectedRoute.value = route;
  showRouteDetails.value = true;
};

const closeRouteDetails = (): void => {
  showRouteDetails.value = false;
  selectedRoute.value = null;
};

const toggleStatsPanel = (): void => {
  isStatsPanelCollapsed.value = !isStatsPanelCollapsed.value;
};

const checkMobile = (): void => {
  isMobile.value = window.innerWidth <= 768;
};

// Debounced zoom handler for better performance
let zoomTimeout: ReturnType<typeof setTimeout>;
const handleZoomEnd = (): void => {
  clearTimeout(zoomTimeout);
  zoomTimeout = setTimeout(() => {
    isZooming.value = false;
  }, 150);
};

const onMapReady = async (): Promise<void> => {
  isMapReady.value = true;
  await nextTick();

  if (!mapRef.value?.leafletObject) return;

  const map = mapRef.value.leafletObject as LeafletMap;
  const { minZoom, maxZoom, initialZoom: fixedInitialZoom } = zoomLevels.value;

  // Configure map
  map.setMinZoom(minZoom);
  map.setMaxZoom(maxZoom);
  initialZoom.value = fixedInitialZoom;

  // Set to your desired center and zoom
  map.setView([10, 103.9915], fixedInitialZoom, { animate: false });

  // Performance optimizations
  if (map.options) {
    Object.assign(map.options, {
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
      preferCanvas: true,
    });
  }

  // Event handlers
  map.on("zoomstart", () => {
    isZooming.value = true;
  });
  map.on("zoomend", () => {
    currentZoom.value = map.getZoom();
    handleZoomEnd();
  });
  map.on("zoom", () => {
    currentZoom.value = map.getZoom();
  });

  // Remove the fitBounds logic entirely since you want fixed positioning
  currentZoom.value = fixedInitialZoom;
};

// --- Utility Functions ---
const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString();
const formatTime = (timeString: string): string => timeString.substring(0, 5);

// --- Watchers ---
watch([clientSideTheme, isDark], async () => {
  await nextTick();
});

// --- Lifecycle ---
onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;

  checkMobile();
  window.addEventListener("resize", checkMobile);

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
  <div v-if="isClient" class="flight-map-container" :style="{ height: props.height }">
    <!-- Map -->
    <LMap
      ref="mapRef"
      :zoom="zoomLevels.initialZoom"
      :center="[10, 103.9915]"
      :options="{
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
        minZoom: zoomLevels.minZoom,
        maxZoom: zoomLevels.maxZoom,
        maxBounds: mapBounds || [
          [-85, -175],
          [85, 175],
        ],
        maxBoundsViscosity: 1.0,
        preferCanvas: true,
        zoomAnimation: true,
        fadeAnimation: false,
        markerZoomAnimation: false,
        updateWhenZooming: false,
        updateWhenIdle: true,
        zoomAnimationThreshold: 2,
        wheelDebounceTime: 40,
        wheelPxPerZoomLevel: 80,
        bounceAtZoomLimits: false,
        worldCopyJump: false,
      }"
      :class="[
        'map-instance !w-full !h-full !rounded-lg !border',
        clientSideTheme && isDark ? '!border-gray-700' : '!border-gray-200',
      ]"
      @ready="onMapReady"
    >
      <!-- Tile Layer -->
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

      <!-- Zoom Control -->
      <LControlZoom position="topright" />

      <!-- Flight Routes -->
      <template v-if="isMapReady && !isZooming">
        <LPolyline
          v-for="route in simplifiedRoutes"
          :key="route.key"
          :lat-lngs="route.coordinates"
          :color="routeColor"
          :weight="2"
          :opacity="route.opacity"
          :options="{
            className: 'flight-route',
            smoothFactor: currentZoom < 5 ? 3.0 : 1.0,
            noClip: true,
            interactive: !isZooming,
            bubblingMouseEvents: false,
            simplifyThreshold: currentZoom < 4 ? 5 : 1,
          }"
          @click="() => handleRouteClick(route)"
        />
      </template>

      <!-- Airport Pins (zoomed in) -->
      <template v-if="isMapReady && !isZooming && currentZoom > 4 && pinIcon && isLeafletLoaded">
        <LMarker
          v-for="airport in simplifiedAirports"
          :key="`pin-${airport.code}`"
          :lat-lng="[airport.lat, airport.lng]"
          :icon="pinIcon"
          :options="{
            className: 'airport-pin',
            interactive: !isZooming,
            bubblingMouseEvents: false,
            riseOnHover: true,
          }"
        >
          <LPopup
            :options="{
              className: 'custom-popup',
              closeButton: true,
              autoClose: true,
              closeOnEscapeKey: true,
              keepInView: true,
              autoPan: false,
            }"
          >
            <div
              class="popup-content"
              :class="clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800'"
            >
              <div class="!mb-2">
                <h3
                  class="!text-sm !font-bold !leading-none !my-1"
                  :class="clientSideTheme && isDark ? '!text-blue-400' : '!text-blue-600'"
                >
                  {{ airport.displayCode }}
                </h3>
              </div>
              <div class="!space-y-1 !text-xs">
                <p class="!font-medium !leading-tight">{{ airport.name }}</p>
                <p class="!opacity-75 !leading-tight">{{ airport.city }}, {{ airport.country }}</p>
                <div
                  class="!pt-1 !border-t !border-opacity-20"
                  :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
                >
                  <p class="!text-xs !opacity-70 !leading-tight !my-1">
                    <span
                      class="!font-medium"
                      :class="clientSideTheme && isDark ? '!text-orange-400' : '!text-orange-600'"
                    >
                      {{ airport.flightCount }}
                    </span>
                    flights
                  </p>
                </div>
              </div>
            </div>
          </LPopup>
        </LMarker>
      </template>

      <!-- Airport Dots (zoomed out) -->
      <template v-if="isMapReady && !isZooming && currentZoom <= 4">
        <LCircleMarker
          v-for="airport in simplifiedAirports"
          :key="`dot-${airport.code}`"
          :lat-lng="[airport.lat, airport.lng]"
          :radius="4"
          :color="clientSideTheme && isDark ? '#fbbf24' : '#92400e'"
          :fill-color="clientSideTheme && isDark ? '#f59e0b' : '#d97706'"
          :weight="1"
          :opacity="1"
          :fill-opacity="0.8"
          :options="{
            className: 'airport-dot',
            interactive: !isZooming,
            bubblingMouseEvents: false,
            pane: 'markerPane',
          }"
        >
          <LPopup
            :options="{
              className: 'custom-popup',
              closeButton: true,
              autoClose: true,
              closeOnEscapeKey: true,
              keepInView: true,
              autoPan: false,
            }"
          >
            <div
              class="popup-content"
              :class="clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800'"
            >
              <div class="!mb-2">
                <h3
                  class="!text-sm !font-bold !leading-none !my-1"
                  :class="clientSideTheme && isDark ? '!text-blue-400' : '!text-blue-600'"
                >
                  {{ airport.displayCode }}
                </h3>
              </div>
              <div class="!space-y-1 !text-xs">
                <p class="!font-medium !leading-tight">{{ airport.name }}</p>
                <p class="!opacity-75 !leading-tight">{{ airport.city }}, {{ airport.country }}</p>
                <div
                  class="!pt-1 !border-t !border-opacity-20"
                  :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
                >
                  <p class="!text-xs !opacity-70 !leading-tight !my-1">
                    <span
                      class="!font-medium"
                      :class="clientSideTheme && isDark ? '!text-orange-400' : '!text-orange-600'"
                    >
                      {{ airport.flightCount }}
                    </span>
                    flights
                  </p>
                </div>
              </div>
            </div>
          </LPopup>
        </LCircleMarker>
      </template>
    </LMap>

    <!-- Statistics Panel -->
    <div
      class="stats-panel"
      :class="[
        '!border !shadow-lg !transition-all !duration-300 !ease-in-out',
        clientSideTheme && isDark
          ? '!bg-gray-900/95 !text-gray-100 !border-gray-600'
          : '!bg-white/95 !text-gray-800 !border-gray-300',
        isMobile && isStatsPanelCollapsed ? 'collapsed-mobile' : '',
      ]"
    >
      <!-- Mobile collapse button -->
      <button
        v-if="isMobile"
        class="mobile-collapse-btn !absolute !top-2 !right-2 !p-1 !rounded !transition-colors"
        :class="clientSideTheme && isDark ? 'hover:!bg-gray-800' : 'hover:!bg-gray-100'"
        @click="toggleStatsPanel"
      >
        <svg
          class="!w-4 !h-4 !transition-transform !duration-300"
          :class="isStatsPanelCollapsed ? '!rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div class="panel-content" :class="isMobile && isStatsPanelCollapsed ? '!hidden' : ''">
        <div class="!mb-2">
          <h3
            class="!text-sm !font-bold !text-transparent !bg-clip-text !leading-none !my-1"
            :class="
              clientSideTheme && isDark
                ? '!bg-gradient-to-r !from-blue-400 !to-purple-400'
                : '!bg-gradient-to-r !from-blue-600 !to-purple-600'
            "
          >
            Flight Statistics
          </h3>
        </div>
        <div class="stats-grid !grid !grid-cols-2 !gap-2 !text-xs">
          <div class="!text-center">
            <div
              class="!text-base !font-bold !mb-0.5"
              :class="clientSideTheme && isDark ? '!text-blue-400' : '!text-blue-600'"
            >
              {{ statistics.totalFlights }}
            </div>
            <div class="!opacity-75 !text-xs">Total Flights</div>
          </div>
          <div class="!text-center">
            <div
              class="!text-base !font-bold !mb-0.5"
              :class="clientSideTheme && isDark ? '!text-green-400' : '!text-green-600'"
            >
              {{ statistics.uniqueRoutes }}
            </div>
            <div class="!opacity-75 !text-xs">Unique Routes</div>
          </div>
          <div class="!text-center">
            <div
              class="!text-base !font-bold !mb-0.5"
              :class="clientSideTheme && isDark ? '!text-orange-400' : '!text-orange-600'"
            >
              {{ statistics.airportsVisited }}
            </div>
            <div class="!opacity-75 !text-xs">Airports</div>
          </div>
          <div class="!text-center">
            <div
              class="!text-base !font-bold !mb-0.5"
              :class="clientSideTheme && isDark ? '!text-purple-400' : '!text-purple-600'"
            >
              {{ statistics.countriesVisited }}
            </div>
            <div class="!opacity-75 !text-xs">Countries</div>
          </div>
        </div>

        <!-- Legend section for mobile -->
        <div
          class="legend-section !mt-3 !pt-3 !border-t !border-opacity-20 md:!hidden"
          :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
        >
          <h4
            class="!text-xs !font-bold !mb-2"
            :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'"
          >
            Legend
          </h4>
          <div class="!space-y-1.5 !text-xs">
            <div class="!flex !items-center !gap-2">
              <div
                class="!w-4 !h-0.5 !rounded-full !opacity-80"
                :class="clientSideTheme && isDark ? '!bg-blue-400' : '!bg-blue-500'"
              ></div>
              <span class="!font-medium !text-xs">Flight Routes</span>
            </div>
            <div class="!flex !items-center !gap-2">
              <div
                class="!w-2.5 !h-4 airport-pin-legend !flex-shrink-0"
                :class="clientSideTheme && isDark ? 'pin-dark' : 'pin-light'"
              ></div>
              <span class="!font-medium !text-xs">Airports</span>
            </div>
            <p class="!text-xs !opacity-70 !leading-tight !italic">
              Route opacity indicates flight frequency
            </p>
          </div>
        </div>
      </div>

      <!-- Collapsed state indicator -->
      <div
        v-if="isMobile && isStatsPanelCollapsed"
        class="collapsed-indicator !flex !items-center !gap-2 !text-xs !opacity-75"
      >
        <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
    </div>

    <!-- Legend Panel -->
    <div
      class="legend-panel !hidden md:!block"
      :class="[
        '!border !shadow-lg !transition-all !duration-300 !ease-in-out',
        clientSideTheme && isDark
          ? '!bg-gray-900/95 !text-gray-100 !border-gray-600'
          : '!bg-white/95 !text-gray-800 !border-gray-300',
      ]"
    >
      <div class="!mb-3">
        <h4
          class="!text-sm !font-bold !leading-none !my-1"
          :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'"
        >
          Legend
        </h4>
      </div>
      <div class="!space-y-1.5 !text-xs">
        <div class="!flex !items-center !gap-2.5">
          <div
            class="!w-5 !h-0.5 !rounded-full !opacity-80"
            :class="clientSideTheme && isDark ? '!bg-blue-400' : '!bg-blue-500'"
          ></div>
          <span class="!font-medium">Flight Routes</span>
        </div>
        <div class="!flex !items-center !gap-2.5">
          <div
            class="!w-3 !h-5 airport-pin-legend !flex-shrink-0"
            :class="clientSideTheme && isDark ? 'pin-dark' : 'pin-light'"
          ></div>
          <span class="!font-medium">Airports</span>
        </div>
        <div
          class="!pt-1 !border-t !border-opacity-20"
          :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
        >
          <p class="!text-xs !opacity-70 !leading-tight !italic !my-1">
            Route opacity indicates flight frequency
          </p>
        </div>
      </div>
    </div>

    <!-- Route Details Modal -->
    <div
      v-if="showRouteDetails && selectedRoute"
      class="modal-overlay !fixed !inset-0 !bg-black/50 !flex !items-center !justify-center !backdrop-blur-sm"
      @click="closeRouteDetails"
    >
      <div
        class="modal-content !p-6 !rounded-lg !shadow-xl !max-w-md !w-full !mx-4 !max-h-96 !overflow-y-auto"
        :class="[
          '!border',
          clientSideTheme && isDark
            ? '!bg-gray-800 !text-gray-100 !border-gray-700'
            : '!bg-white !text-gray-800 !border-gray-200',
        ]"
        @click.stop
      >
        <div class="!flex !justify-between !items-center !mb-4">
          <h3 class="!text-lg !font-semibold">{{ selectedRoute.from }} → {{ selectedRoute.to }}</h3>
          <button
            class="!text-gray-500 hover:!text-gray-700 dark:!text-gray-400 dark:hover:!text-gray-200 !transition-colors"
            @click="closeRouteDetails"
          >
            <svg class="!w-5 !h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="!mb-4">
          <p class="!text-sm !mb-2">
            <strong>{{ selectedRoute.count }}</strong> flights on this route
          </p>
          <div class="!text-xs !space-y-1">
            <p><strong>From:</strong> {{ AIRPORT_COORDINATES[selectedRoute.from]?.name }}</p>
            <p><strong>To:</strong> {{ AIRPORT_COORDINATES[selectedRoute.to]?.name }}</p>
          </div>
        </div>

        <div class="!space-y-2">
          <h4 class="!text-sm !font-medium">Flight History:</h4>
          <div class="!space-y-1 !max-h-48 !overflow-y-auto">
            <div
              v-for="(flight, index) in selectedRoute.flights.slice(0, 10)"
              :key="index"
              class="!text-xs !p-2 !rounded !transition-colors"
              :class="clientSideTheme && isDark ? '!bg-gray-700' : '!bg-gray-50'"
            >
              <div class="!flex !justify-between !items-center">
                <span class="!font-medium">{{ flight.flightNumber }}</span>
                <span>{{ formatDate(flight.date) }}</span>
              </div>
              <div class="!flex !justify-between !text-xs !opacity-75">
                <span>{{ formatTime(flight.time) }}</span>
                <span>{{ flight.airline }}</span>
              </div>
            </div>
            <div
              v-if="selectedRoute.flights.length > 10"
              class="!text-xs !text-center !opacity-75 !py-2"
            >
              ... and {{ selectedRoute.flights.length - 10 }} more flights
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SSR Fallback -->
    <div
      v-else
      class="flight-map-container !flex !items-center !justify-center !bg-gray-100 dark:!bg-gray-800"
      :style="{ height: props.height }"
    >
      <div class="!text-center !p-8">
        <div
          class="!w-8 !h-8 !border-4 !border-blue-600 !border-t-transparent !rounded-full !animate-spin !mx-auto !mb-4"
        ></div>
        <p class="!text-gray-600 dark:!text-gray-400">Loading flight map...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flight-map-container {
  position: relative;
  width: 100%;
  min-height: 400px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.map-instance {
  height: 100%;
  z-index: 1;
}

.stats-panel {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  box-shadow:
    0 10px 25px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -2px rgb(0 0 0 / 0.05);
  width: 16rem;
  backdrop-filter: blur(12px);
  z-index: 20;
  border-width: 1px;
  transition: all 0.2s ease-in-out;
}

.stats-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 35px -5px rgb(0 0 0 / 0.15),
    0 10px 10px -5px rgb(0 0 0 / 0.04);
}

.stats-panel.collapsed-mobile {
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem;
  width: auto;
  min-width: 4rem;
}

.stats-panel.collapsed-mobile:hover {
  transform: translateX(-50%) translateY(-2px);
}

.mobile-collapse-btn {
  z-index: 1;
}

.collapsed-indicator {
  padding: 0.25rem;
}

.legend-panel {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  box-shadow:
    0 10px 25px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -2px rgb(0 0 0 / 0.05);
  min-width: 11rem;
  backdrop-filter: blur(12px);
  z-index: 20;
  border-width: 1px;
  transition: all 0.2s ease-in-out;
}

.legend-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 35px -5px rgb(0 0 0 / 0.15),
    0 10px 10px -5px rgb(0 0 0 / 0.04);
}

.airport-pin-legend {
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='18' viewBox='0 0 24 36' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z' fill='%23d97706' stroke='%2378350f' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='4' fill='white'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.airport-pin-legend.pin-dark {
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='18' viewBox='0 0 24 36' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z' fill='%23f59e0b' stroke='%2392400e' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='4' fill='white'/%3E%3C/svg%3E");
}

:deep(.custom-popup .leaflet-popup-content-wrapper) {
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

:deep(.custom-popup .leaflet-popup-content) {
  margin: 0 !important;
  font-family: inherit !important;
}

:deep(.custom-popup .leaflet-popup-tip) {
  background: var(--vp-c-bg) !important;
  border-color: var(--vp-c-border) !important;
}

:deep(.custom-popup .leaflet-popup-close-button) {
  color: var(--vp-c-text-2) !important;
  font-size: 18px !important;
  font-weight: bold !important;
  right: 8px !important;
  top: 8px !important;
  width: 20px !important;
  height: 20px !important;
  text-align: center !important;
  line-height: 20px !important;
  border-radius: 50% !important;
  transition: all 0.15s ease !important;
}

:deep(.custom-popup .leaflet-popup-close-button:hover) {
  background: var(--vp-c-bg-soft) !important;
  color: var(--vp-c-text-1) !important;
}

:deep(.custom-pin-icon) {
  background: none !important;
  border: none !important;
  cursor: pointer;
  transform: translate3d(0, 0, 0);
  will-change: transform;
  transition: transform 0.1s ease-out;
}

:deep(.custom-pin-icon:hover) {
  transform: translate3d(0, -2px, 0) scale(1.05);
}

:deep(.flight-route) {
  cursor: pointer;
  transition: opacity 0.15s ease-out;
}

:deep(.flight-route:hover) {
  opacity: 1 !important;
}

:deep(.airport-pin) {
  cursor: pointer;
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

:deep(.airport-dot) {
  cursor: pointer;
  transition: opacity 0.15s ease-out;
}

:deep(.airport-dot:hover) {
  opacity: 1 !important;
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

:deep(.leaflet-zoom-animated) {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

:deep(.leaflet-marker-pane) {
  transform: translate3d(0, 0, 0);
  will-change: transform;
  backface-visibility: hidden;
}

:deep(.leaflet-overlay-pane) {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

:deep(.leaflet-overlay-pane svg) {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

:deep(.leaflet-container) {
  transform: translate3d(0, 0, 0);
  image-rendering: optimizeSpeed;
  image-rendering: -webkit-optimize-contrast;
}

:deep(.leaflet-popup-pane) {
  pointer-events: none;
}

:deep(.leaflet-popup) {
  pointer-events: auto;
}

@media (max-width: 768px) {
  .flight-map-container {
    min-height: 350px;
  }

  .stats-panel {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    width: auto;
    padding: 0.75rem;
  }

  .stats-panel .stats-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .stats-panel.collapsed-mobile {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: auto;
  }
}

@media (max-width: 480px) {
  .stats-panel {
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
  }

  .stats-panel.collapsed-mobile {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
}

.flight-map-container.full-viewport {
  height: 100vh !important;
  min-height: 100vh;
}
</style>
