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
type TransportMode = "flight" | "train";

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

interface TrainData {
  date: string;
  time: string;
  origin: string; // station code, must exist in STATIONS
  destination: string; // station code, must exist in STATIONS
  operator: string;
  trainNumber?: string | null;
  departureDateTime?: string;
  arrivalDateTime?: string;
  class?: string | null;
  seat?: string | null;
}

// Internal normalized shape for both modes
interface Trip {
  mode: TransportMode;
  date: string;
  time: string;
  origin: string;
  destination: string;
  number: string;
  operator: string;
}

interface Route {
  key: string;
  mode: TransportMode;
  from: string;
  to: string;
  count: number;
  flights: Trip[];
  coordinates: [number, number][];
  opacity: number;
}

interface Place {
  code: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
}

interface Location extends Place {
  mode: TransportMode;
  displayCode: string;
  visitCount: number;
}

interface Props {
  flights?: FlightData[];
  trains?: TrainData[];
  height?: string;
}

interface MapRef {
  leafletObject: LeafletMap;
}

interface Statistics {
  totalTrips: number;
  uniqueRoutes: number;
  locationsVisited: number;
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
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_31lc_1_e89ce8bccdf2f338578298c9",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_31lc_1_e89ce8bccdf2f338578298c9",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

// Per-mode visuals: flights = blue routes + amber pins, trains = green routes + emerald pins
const MODE_STYLE = {
  flight: {
    noun: "flight",
    routeLabel: "Flight Routes",
    placeLabel: "Airports",
    light: { route: "#3b82f6", pin: "#d97706", pinStroke: "#78350f", dotStroke: "#92400e" },
    dark: { route: "#60a5fa", pin: "#f59e0b", pinStroke: "#92400e", dotStroke: "#fbbf24" },
  },
  train: {
    noun: "train",
    routeLabel: "Train Routes",
    placeLabel: "Stations",
    light: { route: "#16a34a", pin: "#059669", pinStroke: "#064e3b", dotStroke: "#064e3b" },
    dark: { route: "#4ade80", pin: "#10b981", pinStroke: "#065f46", dotStroke: "#34d399" },
  },
} as const;

const MODES: TransportMode[] = ["flight", "train"];

const AIRPORTS: Record<string, Place> = {
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
  MAN: {
    code: "MAN",
    lat: 53.365,
    lng: -2.272,
    name: "Manchester Airport",
    city: "Manchester",
    country: "United Kingdom",
  },
  BRU: {
    code: "BRU",
    lat: 50.9014,
    lng: 4.4844,
    name: "Brussels Airport",
    city: "Brussels",
    country: "Belgium",
  },
};

// Codes are your own identifiers, they only need to match TrainData.origin/destination.
const STATIONS: Record<string, Place> = {
  // Belgium / UK
  LOM: {
    code: "LOM",
    lat: 51.2294,
    lng: 5.3119,
    name: "Lommel Station",
    city: "Lommel",
    country: "Belgium",
  },
  BRM: {
    code: "BRM",
    lat: 50.8355,
    lng: 4.3367,
    name: "Brussels-Midi (Zuid) Station",
    city: "Brussels",
    country: "Belgium",
  },
  ANR: {
    code: "ANR",
    lat: 51.2172,
    lng: 4.4212,
    name: "Antwerpen-Centraal",
    city: "Antwerp",
    country: "Belgium",
  },
  BRG: {
    code: "BRG",
    lat: 51.1972,
    lng: 3.2169,
    name: "Brugge Station",
    city: "Bruges",
    country: "Belgium",
  },
  SPX: {
    code: "SPX",
    lat: 51.5322,
    lng: -0.1263,
    name: "London St Pancras International",
    city: "London",
    country: "United Kingdom",
  },
  EUS: {
    code: "EUS",
    lat: 51.5282,
    lng: -0.1337,
    name: "London Euston",
    city: "London",
    country: "United Kingdom",
  },
  KGX: {
    code: "KGX",
    lat: 51.5309,
    lng: -0.1233,
    name: "London King's Cross",
    city: "London",
    country: "United Kingdom",
  },
  EDB: {
    code: "EDB",
    lat: 55.952,
    lng: -3.1895,
    name: "Edinburgh Waverley",
    city: "Edinburgh",
    country: "United Kingdom",
  },
  YRK: {
    code: "YRK",
    lat: 53.958,
    lng: -1.0931,
    name: "York Station",
    city: "York",
    country: "United Kingdom",
  },
  MCV: {
    code: "MCV",
    lat: 53.477,
    lng: -2.2309,
    name: "Manchester Piccadilly",
    city: "Manchester",
    country: "United Kingdom",
  },

  // France / Riviera
  ANT: {
    code: "ANT",
    lat: 43.5811,
    lng: 7.1251,
    name: "Antibes Station",
    city: "Antibes",
    country: "France",
  },
  MRS: {
    code: "MRS",
    lat: 43.3028,
    lng: 5.3806,
    name: "Marseille Saint-Charles",
    city: "Marseille",
    country: "France",
  },
  CNS: {
    code: "CNS",
    lat: 43.5535,
    lng: 7.0195,
    name: "Cannes Station",
    city: "Cannes",
    country: "France",
  },
  NIC: {
    code: "NIC",
    lat: 43.7043,
    lng: 7.262,
    name: "Nice-Ville Station",
    city: "Nice",
    country: "France",
  },
  EZE: {
    code: "EZE",
    lat: 43.7276,
    lng: 7.3619,
    name: "Èze Village",
    city: "Èze",
    country: "France",
  },
  MCO: {
    code: "MCO",
    lat: 43.734,
    lng: 7.4204,
    name: "Monaco-Monte-Carlo Station",
    city: "Monaco",
    country: "Monaco",
  },
  MNT: {
    code: "MNT",
    lat: 43.777,
    lng: 7.497,
    name: "Menton Station",
    city: "Menton",
    country: "France",
  },
  VTM: {
    code: "VTM",
    lat: 43.7893,
    lng: 7.607,
    name: "Ventimiglia Station",
    city: "Ventimiglia",
    country: "Italy",
  },
  PNO: {
    code: "PNO",
    lat: 48.8809,
    lng: 2.3553,
    name: "Paris Gare du Nord",
    city: "Paris",
    country: "France",
  },
  PLY: {
    code: "PLY",
    lat: 48.8443,
    lng: 2.3744,
    name: "Paris Gare de Lyon",
    city: "Paris",
    country: "France",
  },
  VSL: {
    code: "VSL",
    lat: 48.8008,
    lng: 2.1265,
    name: "Versailles Château Rive Gauche",
    city: "Versailles",
    country: "France",
  },

  // Italy / Switzerland / Germany / Netherlands
  MIL: {
    code: "MIL",
    lat: 45.4863,
    lng: 9.2045,
    name: "Milano Centrale",
    city: "Milan",
    country: "Italy",
  },
  ZER: {
    code: "ZER",
    lat: 46.0239,
    lng: 7.7476,
    name: "Zermatt Station",
    city: "Zermatt",
    country: "Switzerland",
  },
  ZRH: {
    code: "ZRH",
    lat: 47.3778,
    lng: 8.5403,
    name: "Zürich Hauptbahnhof",
    city: "Zurich",
    country: "Switzerland",
  },
  CGN: {
    code: "CGN",
    lat: 50.943,
    lng: 6.9589,
    name: "Köln Hauptbahnhof",
    city: "Cologne",
    country: "Germany",
  },
  AMC: {
    code: "AMC",
    lat: 52.3791,
    lng: 4.9003,
    name: "Amsterdam Centraal",
    city: "Amsterdam",
    country: "Netherlands",
  },
  FRH: {
    code: "FRH",
    lat: 50.1071,
    lng: 8.6638,
    name: "Frankfurt (Main) Hauptbahnhof",
    city: "Frankfurt",
    country: "Germany",
  },
  MNZ: {
    code: "MNZ",
    lat: 50.0013,
    lng: 8.2589,
    name: "Mainz Hauptbahnhof",
    city: "Mainz",
    country: "Germany",
  },
  DAR: {
    code: "DAR",
    lat: 49.8725,
    lng: 8.6313,
    name: "Darmstadt Hauptbahnhof",
    city: "Darmstadt",
    country: "Germany",
  },

  // India
  SBC: {
    code: "SBC",
    lat: 12.9784,
    lng: 77.5698,
    name: "KSR Bengaluru City Junction",
    city: "Bangalore",
    country: "India",
  },
  MYS: {
    code: "MYS",
    lat: 12.3125,
    lng: 76.6434,
    name: "Mysuru Junction",
    city: "Mysore",
    country: "India",
  },

  // Indonesia
  GMR: {
    code: "GMR",
    lat: -6.1767,
    lng: 106.8306,
    name: "Gambir Station",
    city: "Jakarta",
    country: "Indonesia",
  },
  YKT: {
    code: "YKT",
    lat: -7.7892,
    lng: 110.3633,
    name: "Yogyakarta Tugu Station",
    city: "Yogyakarta",
    country: "Indonesia",
  },
};

const REGISTRY: Record<TransportMode, Record<string, Place>> = {
  flight: AIRPORTS,
  train: STATIONS,
};

const lookup = (mode: TransportMode, code: string): Place | undefined => REGISTRY[mode][code];

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  flights: () => [],
  trains: () => [],
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

const isDarkTheme = computed(() => clientSideTheme.value && isDark.value);

const tileConfig = computed(() => (isDarkTheme.value ? TILE_CONFIG.dark : TILE_CONFIG.light));

const modeColors = (mode: TransportMode) => MODE_STYLE[mode][isDarkTheme.value ? "dark" : "light"];
const routeColor = (mode: TransportMode): string => modeColors(mode).route;

// Train pins get a square glyph, flight pins a circle (helps beyond color alone)
const pinSvg = (mode: TransportMode, dark: boolean): string => {
  const { pin, pinStroke } = MODE_STYLE[mode][dark ? "dark" : "light"];
  const glyph =
    mode === "train"
      ? `<rect x="8" y="8" width="8" height="8" rx="1.5" fill="white"/>`
      : `<circle cx="12" cy="12" r="4" fill="white"/>`;
  return `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" fill="${pin}" stroke="${pinStroke}" stroke-width="1"/>${glyph}</svg>`;
};

const pinDataUri = (mode: TransportMode): string =>
  `url("data:image/svg+xml,${encodeURIComponent(pinSvg(mode, isDarkTheme.value))}")`;

const createPinIcon = (
  mode: TransportMode,
  dark: boolean,
): LeafletTypes.Icon<LeafletTypes.IconOptions> | null => {
  if (!L.value || !isLeafletLoaded.value) return null;

  return L.value.divIcon({
    html: pinSvg(mode, dark),
    className: "custom-pin-icon",
    iconSize: [24, 36] as [number, number],
    iconAnchor: [12, 36] as [number, number],
    popupAnchor: [0, -36] as [number, number],
  }) as LeafletTypes.Icon<LeafletTypes.IconOptions>;
};

const pinIcons = computed<
  Record<TransportMode, LeafletTypes.Icon<LeafletTypes.IconOptions> | null>
>(() => ({
  flight: createPinIcon("flight", isDarkTheme.value),
  train: createPinIcon("train", isDarkTheme.value),
}));

// Normalize both inputs into a single trip list
const trips = computed<Trip[]>(() => [
  ...props.flights.map(f => ({
    mode: "flight" as const,
    date: f.date,
    time: f.time,
    origin: f.origin,
    destination: f.destination,
    number: f.flightNumber,
    operator: f.airline,
  })),
  ...props.trains.map(t => ({
    mode: "train" as const,
    date: t.date,
    time: t.time,
    origin: t.origin,
    destination: t.destination,
    number: t.trainNumber ?? "",
    operator: t.operator,
  })),
]);

const activeModes = computed<TransportMode[]>(() =>
  MODES.filter(mode => trips.value.some(trip => trip.mode === mode)),
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
    // Wrap the more western coordinate eastward to avoid extreme negative values
    if (lng1 < lng2) {
      adjustedLng1 = lng1 + 360;
    } else {
      adjustedLng2 = lng2 + 360;
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

// Memoized routes computation (routes are grouped per mode, so a flight and a train
// between the same two cities remain separate lines)
const routes = computed<Route[]>(() => {
  const routeMap = new Map<string, Route>();

  for (const trip of trips.value) {
    const fromPlace = lookup(trip.mode, trip.origin);
    const toPlace = lookup(trip.mode, trip.destination);

    if (!fromPlace || !toPlace) {
      console.warn(
        `Skipping ${trip.mode} with unknown location code: ${trip.origin} -> ${trip.destination}`,
      );
      continue;
    }

    const routeKey = `${trip.mode}:${trip.origin}-${trip.destination}`;
    const reverseKey = `${trip.mode}:${trip.destination}-${trip.origin}`;
    const existingRoute = routeMap.get(routeKey) || routeMap.get(reverseKey);

    if (existingRoute) {
      existingRoute.count++;
      existingRoute.flights.push(trip);
    } else {
      routeMap.set(routeKey, {
        key: routeKey,
        mode: trip.mode,
        from: trip.origin,
        to: trip.destination,
        count: 1,
        flights: [trip],
        coordinates: createCurvedPath([fromPlace.lat, fromPlace.lng], [toPlace.lat, toPlace.lng]),
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

const performanceConfig = computed(() => ({
  shouldShowAllRoutes: !isZooming.value && currentZoom.value >= 3,
  shouldShowAllLocations: !isZooming.value && currentZoom.value >= 4,
  maxRoutes: isZooming.value ? 20 : Infinity,
  maxLocations: isZooming.value
    ? 15
    : currentZoom.value < 3
      ? 20
      : currentZoom.value < 4
        ? 30
        : Infinity,
  minVisitCount: isZooming.value ? 2 : currentZoom.value < 3 ? 3 : currentZoom.value < 4 ? 1 : 0,
}));

const simplifiedRoutes = computed<Route[]>(() => {
  const config = performanceConfig.value;

  if (!config.shouldShowAllRoutes) {
    return routes.value.filter(route => route.count > 1).slice(0, config.maxRoutes);
  }
  return routes.value;
});

const simplifiedLocations = computed<Location[]>(() => {
  const config = performanceConfig.value;

  if (isZooming.value) {
    return locations.value.filter(loc => loc.visitCount > 2).slice(0, 15);
  }

  const filtered = locations.value.filter(loc => loc.visitCount > config.minVisitCount);
  return config.maxLocations === Infinity ? filtered : filtered.slice(0, config.maxLocations);
});

const getBounds = () => {
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

const mapBounds = computed(() => getBounds());

const locations = computed<Location[]>(() => {
  const locationMap = new Map<string, Location>();
  const wrappedKeys = new Set<string>();

  for (const trip of trips.value) {
    const fromPlace = lookup(trip.mode, trip.origin);
    const toPlace = lookup(trip.mode, trip.destination);
    if (!fromPlace || !toPlace) continue;

    for (const place of [fromPlace, toPlace]) {
      const key = `${trip.mode}:${place.code}`;
      const existing = locationMap.get(key);
      if (existing) {
        existing.visitCount++;
      } else {
        locationMap.set(key, {
          ...place,
          mode: trip.mode,
          displayCode: place.code,
          visitCount: 1,
        });
      }
    }

    const eastwardDistance = Math.abs(toPlace.lng - fromPlace.lng);
    const westwardDistance = 360 - eastwardDistance;

    if (westwardDistance < eastwardDistance) {
      wrappedKeys.add(`${trip.mode}:${fromPlace.code}`);
      wrappedKeys.add(`${trip.mode}:${toPlace.code}`);
    }
  }

  const bounds = mapBounds.value;
  const wrappedData: Location[] = [];

  if (bounds) {
    const [minLng, maxLng] = [bounds[0][1], bounds[1][1]];

    for (const key of wrappedKeys) {
      const original = locationMap.get(key);
      if (!original) continue;

      const wrappedLng = original.lng < 0 ? original.lng + 360 : original.lng - 360;

      if (wrappedLng >= minLng && wrappedLng <= maxLng) {
        wrappedData.push({
          ...original,
          code: `${original.code}-wrapped`,
          displayCode: original.code,
          lng: wrappedLng,
        });
      }
    }
  }

  const filteredOriginals = Array.from(locationMap.entries())
    .filter(([key, loc]) => {
      if (bounds) {
        const [minLng, maxLng] = [bounds[0][1], bounds[1][1]];
        if (loc.lng < minLng || loc.lng > maxLng) return false;

        // Only exclude the original if it's way outside normal range and its wrapped copy is in bounds
        if (wrappedKeys.has(key)) {
          const wrappedLng = loc.lng < 0 ? loc.lng + 360 : loc.lng - 360;
          if ((loc.lng < -200 || loc.lng > 200) && wrappedLng >= minLng && wrappedLng <= maxLng) {
            return false;
          }
        }
      }
      return true;
    })
    .map(([, loc]) => loc);

  return [...filteredOriginals, ...wrappedData];
});

const zoomLevels = computed<ZoomLevels>(() => ({
  minZoom: 3,
  maxZoom: 8,
  initialZoom: 4,
}));

const statistics = computed<Statistics>(() => ({
  totalTrips: trips.value.length,
  uniqueRoutes: routes.value.length,
  locationsVisited: locations.value.length,
  countriesVisited: new Set(locations.value.map(l => l.country)).size,
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

const createZoomDebouncer = (fn: () => void, delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
};

const handleZoomEnd = createZoomDebouncer(() => {
  isZooming.value = false;
}, 150);

const onMapReady = async (): Promise<void> => {
  isMapReady.value = true;
  await nextTick();

  if (!mapRef.value?.leafletObject) return;

  const map = mapRef.value.leafletObject as LeafletMap;
  const { minZoom, maxZoom, initialZoom: fixedInitialZoom } = zoomLevels.value;

  map.setMinZoom(minZoom);
  map.setMaxZoom(maxZoom);
  initialZoom.value = fixedInitialZoom;

  map.setView([10, 103.9915], fixedInitialZoom, { animate: false });

  if (map.options) {
    Object.assign(map.options, {
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
      preferCanvas: true,
    });
  }

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
        clientSideTheme && isDark ? '!border-gray-700' : '',
      ]"
      :style="!(clientSideTheme && isDark) ? { borderColor: 'rgba(0, 102, 178, 0.20)' } : {}"
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

      <!-- Routes (color depends on mode) -->
      <template v-if="isMapReady && !isZooming">
        <LPolyline
          v-for="route in simplifiedRoutes"
          :key="route.key"
          :lat-lngs="route.coordinates"
          :color="routeColor(route.mode)"
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

      <!-- Location Pins (zoomed in) -->
      <template v-if="isMapReady && !isZooming && currentZoom > 4 && isLeafletLoaded">
        <template v-for="loc in simplifiedLocations" :key="`pin-${loc.mode}-${loc.code}`">
          <LMarker
            v-if="pinIcons[loc.mode]"
            :lat-lng="[loc.lat, loc.lng]"
            :icon="pinIcons[loc.mode]!"
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
                    :style="{ color: modeColors(loc.mode).pin }"
                  >
                    {{ loc.displayCode }}
                  </h3>
                </div>
                <div class="!space-y-1 !text-xs">
                  <p class="!font-medium !leading-tight">{{ loc.name }}</p>
                  <p class="!opacity-75 !leading-tight">{{ loc.city }}, {{ loc.country }}</p>
                  <div
                    class="!pt-1 !border-t !border-opacity-20"
                    :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
                  >
                    <p class="!text-xs !opacity-70 !leading-tight !my-1">
                      <span class="!font-medium" :style="{ color: modeColors(loc.mode).pin }">
                        {{ loc.visitCount }}
                      </span>
                      {{ MODE_STYLE[loc.mode].noun }}{{ loc.visitCount === 1 ? "" : "s" }}
                    </p>
                  </div>
                </div>
              </div>
            </LPopup>
          </LMarker>
        </template>
      </template>

      <!-- Location Dots (zoomed out) -->
      <template v-if="isMapReady && !isZooming && currentZoom <= 4">
        <LCircleMarker
          v-for="loc in simplifiedLocations"
          :key="`dot-${loc.mode}-${loc.code}`"
          :lat-lng="[loc.lat, loc.lng]"
          :radius="4"
          :color="modeColors(loc.mode).dotStroke"
          :fill-color="modeColors(loc.mode).pin"
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
                  :style="{ color: modeColors(loc.mode).pin }"
                >
                  {{ loc.displayCode }}
                </h3>
              </div>
              <div class="!space-y-1 !text-xs">
                <p class="!font-medium !leading-tight">{{ loc.name }}</p>
                <p class="!opacity-75 !leading-tight">{{ loc.city }}, {{ loc.country }}</p>
                <div
                  class="!pt-1 !border-t !border-opacity-20"
                  :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
                >
                  <p class="!text-xs !opacity-70 !leading-tight !my-1">
                    <span class="!font-medium" :style="{ color: modeColors(loc.mode).pin }">
                      {{ loc.visitCount }}
                    </span>
                    {{ MODE_STYLE[loc.mode].noun }}{{ loc.visitCount === 1 ? "" : "s" }}
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
        '!shadow-lg !transition-all !duration-300 !ease-in-out',
        clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800',
        isMobile && isStatsPanelCollapsed ? 'collapsed-mobile' : '',
      ]"
    >
      <!-- Mobile collapse button -->
      <button
        v-if="isMobile"
        class="mobile-collapse-btn !absolute !top-2 !right-2 !p-1 !rounded !transition-colors"
        :class="
          clientSideTheme && isDark ? 'hover:!bg-white/10' : 'hover:!bg-[rgba(0,102,178,0.08)]'
        "
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
            Travel Statistics
          </h3>
        </div>
        <div class="stats-grid !grid !grid-cols-2 !gap-2 !text-xs">
          <div class="!text-center">
            <div
              class="!text-base !font-bold !mb-0.5"
              :class="clientSideTheme && isDark ? '!text-blue-400' : '!text-blue-600'"
            >
              {{ statistics.totalTrips }}
            </div>
            <div class="!opacity-75 !text-xs">Total Trips</div>
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
              {{ statistics.locationsVisited }}
            </div>
            <div class="!opacity-75 !text-xs">Locations</div>
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
            <template v-for="mode in activeModes" :key="`m-legend-${mode}`">
              <div class="!flex !items-center !gap-2">
                <div
                  class="!w-4 !h-0.5 !rounded-full !opacity-80"
                  :style="{ backgroundColor: routeColor(mode) }"
                ></div>
                <span class="!font-medium !text-xs">{{ MODE_STYLE[mode].routeLabel }}</span>
              </div>
              <div class="!flex !items-center !gap-2">
                <div
                  class="!w-2.5 !h-4 location-pin-legend !flex-shrink-0"
                  :style="{ backgroundImage: pinDataUri(mode) }"
                ></div>
                <span class="!font-medium !text-xs">{{ MODE_STYLE[mode].placeLabel }}</span>
              </div>
            </template>
            <p class="!text-xs !opacity-70 !leading-tight !italic">
              Route opacity indicates trip frequency
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
        '!shadow-lg !transition-all !duration-300 !ease-in-out',
        clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800',
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
        <template v-for="mode in activeModes" :key="`d-legend-${mode}`">
          <div class="!flex !items-center !gap-2.5">
            <div
              class="!w-5 !h-0.5 !rounded-full !opacity-80"
              :style="{ backgroundColor: routeColor(mode) }"
            ></div>
            <span class="!font-medium">{{ MODE_STYLE[mode].routeLabel }}</span>
          </div>
          <div class="!flex !items-center !gap-2.5">
            <div
              class="!w-3 !h-5 location-pin-legend !flex-shrink-0"
              :style="{ backgroundImage: pinDataUri(mode) }"
            ></div>
            <span class="!font-medium">{{ MODE_STYLE[mode].placeLabel }}</span>
          </div>
        </template>
        <div
          class="!pt-1 !border-t !border-opacity-20"
          :class="clientSideTheme && isDark ? '!border-gray-600' : '!border-gray-300'"
        >
          <p class="!text-xs !opacity-70 !leading-tight !italic !my-1">
            Route opacity indicates trip frequency
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
          <h3 class="!text-lg !font-semibold">
            <span
              class="!inline-block !w-2.5 !h-2.5 !rounded-full !mr-2"
              :style="{ backgroundColor: routeColor(selectedRoute.mode) }"
            ></span>
            {{ selectedRoute.from }} → {{ selectedRoute.to }}
          </h3>
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
            <strong>{{ selectedRoute.count }}</strong>
            {{ MODE_STYLE[selectedRoute.mode].noun }}{{ selectedRoute.count === 1 ? "" : "s" }} on
            this route
          </p>
          <div class="!text-xs !space-y-1">
            <p><strong>From:</strong> {{ lookup(selectedRoute.mode, selectedRoute.from)?.name }}</p>
            <p><strong>To:</strong> {{ lookup(selectedRoute.mode, selectedRoute.to)?.name }}</p>
          </div>
        </div>

        <div class="!space-y-2">
          <h4 class="!text-sm !font-medium">Trip History:</h4>
          <div class="!space-y-1 !max-h-48 !overflow-y-auto">
            <div
              v-for="(trip, index) in selectedRoute.flights.slice(0, 10)"
              :key="index"
              class="!text-xs !p-2 !rounded !transition-colors"
              :class="clientSideTheme && isDark ? '!bg-gray-700' : '!bg-gray-50'"
            >
              <div class="!flex !justify-between !items-center">
                <span class="!font-medium">{{ trip.number || trip.operator }}</span>
                <span>{{ formatDate(trip.date) }}</span>
              </div>
              <div class="!flex !justify-between !text-xs !opacity-75">
                <span>{{ formatTime(trip.time) }}</span>
                <span>{{ trip.operator }}</span>
              </div>
            </div>
            <div
              v-if="selectedRoute.flights.length > 10"
              class="!text-xs !text-center !opacity-75 !py-2"
            >
              ... and {{ selectedRoute.flights.length - 10 }} more trips
            </div>
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
      <p class="!text-gray-600 dark:!text-gray-400">Loading map...</p>
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
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  width: 16rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  z-index: 20;
  transition: all 0.2s ease-in-out;
}

.stats-panel:hover {
  transform: translateY(-2px);
  background: var(--glass-bg-strong);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
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
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  min-width: 11rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  z-index: 20;
  transition: all 0.2s ease-in-out;
}

.legend-panel:hover {
  transform: translateY(-2px);
  background: var(--glass-bg-strong);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

/* background-image is set inline per mode/theme */
.location-pin-legend {
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

:deep(.custom-popup .leaflet-popup-content-wrapper) {
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius) !important;
  padding: 0.75rem !important;
  box-shadow: var(--glass-shadow) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) !important;
  backdrop-filter: blur(var(--glass-blur)) !important;
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

:root:not(.dark) .stats-panel,
:root:not(.dark) .legend-panel {
  border-color: rgba(0, 102, 178, 0.2) !important;
}
</style>
