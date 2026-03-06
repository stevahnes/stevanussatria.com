<script setup lang="ts">
import { computed } from "vue";

// --- Enhanced Types ---
interface TimelineItem {
  time: string;
  title: string;
  description: string;
  path?: string;
  cta?: string;
  anchor?: string;
}

interface Props {
  items?: TimelineItem[];
}

// --- Constants ---
const TIMELINE_CLASSES = {
  container: "relative border-s border-gray-200 dark:border-gray-700",
  listItem: "list-none mb-10 ms-4",
  dot: "absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700",
  time: "mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500",
  title: "text-lg font-semibold text-gray-900 dark:text-white",
  description: "mb-4 text-base font-normal text-gray-500 dark:text-gray-400",
  link: "inline-flex no-underline! hover:underline items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white/20 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-white/6 dark:text-gray-400 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:hover:text-white dark:hover:bg-white/12 dark:focus:ring-gray-700",
  icon: "w-3 h-3 ms-2 rtl:rotate-180",
} as const;

const SVG_PROPS = {
  "aria-hidden": "true",
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 14 10",
} as const;

const PATH_PROPS = {
  stroke: "currentColor",
  "stroke-linecap": "round" as const,
  "stroke-linejoin": "round" as const,
  "stroke-width": "2",
  d: "M1 5h12m0 0L9 1m4 4L9 9",
} as const;

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  items: () => [],
});

// --- Computed ---
const timelineItems = computed(() => props.items);
const hasItems = computed(() => timelineItems.value.length > 0);

// --- Utility Functions ---
const shouldShowLink = (item: TimelineItem): boolean => Boolean(item.path);
const getItemKey = (item: TimelineItem): string => item.time;
</script>

<template>
  <ol v-if="hasItems" :class="TIMELINE_CLASSES.container">
    <li v-for="item in timelineItems" :key="getItemKey(item)" :class="TIMELINE_CLASSES.listItem">
      <div :class="TIMELINE_CLASSES.dot"></div>

      <time :id="item.anchor" :class="TIMELINE_CLASSES.time">
        {{ item.time }}
      </time>

      <h3 :class="TIMELINE_CLASSES.title">
        {{ item.title }}
      </h3>

      <p :class="TIMELINE_CLASSES.description">
        {{ item.description }}
      </p>

      <div v-show="shouldShowLink(item)">
        <a target="_blank" :href="item.path" :class="TIMELINE_CLASSES.link">
          {{ item.cta }}
          <svg :class="TIMELINE_CLASSES.icon" v-bind="SVG_PROPS">
            <path v-bind="PATH_PROPS" />
          </svg>
        </a>
      </div>
    </li>
  </ol>
</template>

<style scoped>
/* No additional styles needed as we're using Tailwind classes */
</style>
