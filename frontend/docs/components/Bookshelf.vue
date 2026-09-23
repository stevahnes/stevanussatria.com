<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";

interface MediaItem {
  id: string; // e.g., "book-escaping-build-trap"
  type: "book" | "podcast" | "movie" | "show" | "article"; // Media type
  title: string;
  authorOrHost: string;
  status: "consuming" | "completed" | "queued" | "paused";
  coverImage?: string; // URL or local path
  link: string; // External link to Spotify, Goodreads, or SG Library (NLB)
}

interface Props {
  items?: MediaItem[];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
});

type MediaFilter = "all" | MediaItem["type"];
type SortKey = "status" | "title" | "author";

const { isDark } = useData();
const isMounted = ref(false);
const clientSideTheme = ref(false);
const activeFilter = ref<MediaFilter>("all");
const activeSort = ref<SortKey>("status");
const statusPriority: Record<MediaItem["status"], number> = {
  consuming: 0,
  queued: 1,
  completed: 2,
  paused: 2,
};

const filterOptions: Array<{ id: MediaFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "book", label: "Books" },
  { id: "podcast", label: "Podcasts" },
  { id: "movie", label: "Movies" },
  { id: "show", label: "Shows" },
  { id: "article", label: "Articles" },
];
const sortOptions: Array<{ id: SortKey; label: string }> = [
  { id: "status", label: "Status" },
  { id: "title", label: "Title" },
  { id: "author", label: "Author" },
];

onMounted(() => {
  isMounted.value = true;
  clientSideTheme.value = true;
});

const tc = (dark: string, light: string) => (clientSideTheme.value && isDark.value ? dark : light);

const cssVars = computed(() => ({
  "--bs-bg": "var(--glass-bg)",
  "--bs-bg-strong": "var(--glass-bg-strong)",
  "--bs-border":
    clientSideTheme.value && !isDark.value ? "rgba(0, 102, 178, 0.20)" : "var(--glass-border)",
  "--bs-text-primary": tc("#e8f0f8", "#1c2b38"),
  "--bs-text-secondary": tc("rgba(255, 255, 255, 0.65)", "rgba(20, 30, 40, 0.7)"),
  "--bs-mono-text": tc("rgba(227, 241, 255, 0.92)", "rgba(30, 50, 70, 0.92)"),
  "--bs-accent": "#00c2a8",
  "--bs-accent-soft": tc("rgba(0, 194, 168, 0.24)", "rgba(0, 194, 168, 0.2)"),
  "--bs-card-shadow": "var(--glass-shadow)",
  "--bs-hover-shadow": "var(--glass-shadow-hover)",
  "--bs-glass-highlight": tc("rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.68)"),
}));

const items = computed<MediaItem[]>(() => {
  if (!Array.isArray(props.items)) return [];
  return props.items.filter(isMediaItem);
});

const filteredItems = computed(() => {
  const filtered = items.value.filter(item => {
    if (activeFilter.value === "all") return true;
    return item.type === activeFilter.value;
  });

  return filtered.sort((a, b) => {
    if (activeSort.value === "status") {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;
      const titleDiff = a.title.localeCompare(b.title);
      if (titleDiff !== 0) return titleDiff;
      return a.authorOrHost.localeCompare(b.authorOrHost);
    }

    if (activeSort.value === "author") {
      const authorDiff = a.authorOrHost.localeCompare(b.authorOrHost);
      if (authorDiff !== 0) return authorDiff;
      return a.title.localeCompare(b.title);
    }
    const titleDiff = a.title.localeCompare(b.title);
    if (titleDiff !== 0) return titleDiff;
    return a.authorOrHost.localeCompare(b.authorOrHost);
  });
});

function isMediaItem(value: unknown): value is MediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MediaItem>;
  return (
    typeof item.id === "string" &&
    (item.type === "book" || item.type === "podcast" || item.type === "movie" || item.type === "show" || item.type === "article") &&
    typeof item.title === "string" &&
    typeof item.authorOrHost === "string" &&
    (item.status === "consuming" ||
      item.status === "completed" ||
      item.status === "queued" ||
      item.status === "paused") &&
    typeof item.link === "string"
  );
}

function setFilter(filterId: MediaFilter) {
  activeFilter.value = filterId;
}

function setSort(sortKey: SortKey) {
  activeSort.value = sortKey;
}

function typeLabel(type: MediaItem["type"]) {
  if (type === "book") return "Book";
  if (type === "podcast") return "Podcast";
  if (type === "movie") return "Movie";
  if (type === "show") return "Show";
  if (type === "article") return "Article";
}

function statusLabel(status: MediaItem["status"]) {
  if (status === "consuming") return "Consuming";
  if (status === "completed") return "Completed";
  if (status === "paused") return "Paused";
  return "Queued";
}
</script>

<template>
  <section class="bookshelf" :style="cssVars">
    <header class="bookshelf-header">
      <p class="eyebrow">Steve's Library</p>
      <h2 class="title">Bookshelf</h2>
      <p class="subtitle">
        A curated archive of the media feeding my mind and filling my downtime.
      </p>
    </header>

    <div class="filter-row" aria-label="Media filters">
      <template v-if="isMounted">
        <button v-for="filter in filterOptions" :key="filter.id" class="filter-button"
          :class="{ active: activeFilter === filter.id }" type="button" @click="setFilter(filter.id)">
          {{ filter.label }}
        </button>
      </template>
      <template v-else>
        <span class="filter-button active" aria-hidden="true">All</span>
      </template>
    </div>

    <div class="sort-row" aria-label="Sort books">
      <span class="sort-label">Sort by:</span>
      <button v-for="sort in sortOptions" :key="sort.id" class="sort-button" :class="{ active: activeSort === sort.id }"
        type="button" @click="setSort(sort.id)">
        {{ sort.label }}
      </button>
    </div>

    <div v-if="filteredItems.length > 0" class="bento-grid">
      <article v-for="item in filteredItems" :key="item.id" class="media-card" :class="[
        `type-${item.type}`,
        `status-${item.status}`,
        { 'is-featured': item.status === 'consuming' },
      ]">
        <div class="card-top">
          <span class="type-tag">{{ typeLabel(item.type) }}</span>
          <span class="status-tag">{{ statusLabel(item.status) }}</span>
        </div>

        <a class="card-main-link" :href="item.link" target="_blank" rel="noopener noreferrer">
          <div class="cover">
            <img v-if="item.coverImage" :src="item.coverImage" :alt="`${item.title} cover`" />
            <div v-else class="cover-fallback">{{ typeLabel(item.type) }}</div>
          </div>

          <div class="meta">
            <h3 class="media-title">{{ item.title }}</h3>
            <p class="media-author">{{ item.authorOrHost }}</p>
          </div>
        </a>

        <a class="source-button" :href="item.link" target="_blank" rel="noopener noreferrer">
          View source
        </a>
      </article>
    </div>

    <p v-else class="empty-state">No media items in this filter yet.</p>
  </section>
</template>

<style scoped>
.bookshelf {
  --type-book: #ff5f57;
  --type-podcast: #febc2e;
  --type-article: #28c840;
  border: 1px solid var(--bs-border);
  border-radius: 18px;
  padding: 1rem;
  background: var(--bs-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
  box-shadow:
    var(--bs-card-shadow),
    inset 0 1px 0 var(--bs-glass-highlight);
}

.bookshelf-header {
  margin-bottom: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  color: var(--bs-accent);
  font-family: "IBM Plex Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.title {
  margin: 0.1rem 0 0.2rem;
  color: var(--bs-text-primary);
}

.subtitle {
  margin: 0;
  color: var(--bs-text-secondary);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sort-label {
  color: var(--bs-text-secondary);
  font-size: 0.78rem;
}

.filter-button {
  border: 1px solid var(--bs-border);
  border-radius: 999px;
  background: var(--bs-bg-strong);
  color: var(--bs-mono-text);
  padding: 0.28rem 0.7rem;
  font-size: 0.75rem;
  font-family: "IBM Plex Mono", monospace;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.sort-button {
  border: 1px solid var(--bs-border);
  border-radius: 999px;
  background: var(--bs-bg-strong);
  color: var(--bs-mono-text);
  padding: 0.22rem 0.65rem;
  font-size: 0.72rem;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

button.sort-button {
  cursor: pointer;
}

button.sort-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--bs-hover-shadow);
  border-color: var(--bs-accent);
}

.sort-button.active {
  border-color: var(--bs-accent);
  color: var(--bs-accent);
}

button.filter-button {
  cursor: pointer;
}

button.filter-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--bs-hover-shadow);
  border-color: var(--bs-accent);
}

.filter-button.active {
  border-color: var(--bs-accent);
  color: var(--bs-accent);
}

.bento-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  grid-auto-flow: dense;
}

.media-card {
  border: 1px solid var(--bs-border);
  border-radius: 14px;
  padding: 0.8rem;
  background: var(--bs-bg-strong);
  box-shadow:
    var(--bs-card-shadow),
    inset 0 1px 0 var(--bs-glass-highlight);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.media-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--bs-border) 72%, var(--bs-accent));
  box-shadow: var(--bs-hover-shadow);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.type-tag,
.status-tag {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  color: var(--bs-mono-text);
}

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.type-tag::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--type-book);
}

.type-podcast .type-tag::before {
  background: var(--type-podcast);
}

.type-article .type-tag::before {
  background: var(--type-article);
}

.card-main-link {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 0.7rem;
  text-decoration: none;
  margin-bottom: 0.6rem;
}

.card-main-link:focus-visible {
  outline: none;
  border-radius: 10px;
  box-shadow: var(--glass-focus-ring);
}

.cover {
  width: 60px;
  height: 84px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bs-border);
  background: rgba(0, 0, 0, 0.14);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 0.56rem;
  text-align: center;
  padding: 0.35rem;
  color: var(--bs-mono-text);
  font-family: "IBM Plex Mono", monospace;
}

.media-title {
  margin: 0;
  color: var(--bs-text-primary);
  font-size: 0.97rem;
}

.media-author {
  margin: 0.2rem 0 0;
  color: var(--bs-text-secondary);
  font-size: 0.82rem;
}

.source-button {
  display: inline-block;
  margin-top: 0.5rem;
  border: 1px solid var(--bs-accent-soft);
  border-radius: 8px;
  background: rgba(0, 194, 168, 0.08);
  color: var(--bs-accent);
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
  padding: 0.32rem 0.62rem;
  white-space: nowrap;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.source-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--bs-hover-shadow);
}

.filter-button:focus-visible,
.sort-button:focus-visible,
.source-button:focus-visible {
  outline: none;
  box-shadow: var(--glass-focus-ring);
}

.empty-state {
  color: var(--bs-text-secondary);
  margin: 0.3rem 0 0;
}

@media (min-width: 700px) {
  .bento-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .media-card.is-featured {
    grid-column: span 2;
  }
}
</style>
