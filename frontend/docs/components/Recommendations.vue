<script setup lang="ts">
import { ref, computed } from "vue";

// --- Types ---
interface Recommendation {
  id: string;
  name: string;
  title: string;
  company: string;
  testimonial: string;
  date?: string;
}

interface Props {
  recommendations?: Recommendation[];
}

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  recommendations: () => [],
});

// --- State ---
const searchQuery = ref("");
const selectedCompany = ref("all");

// --- Computed ---
const companies = computed(() => {
  const companySet = new Set(props.recommendations.map(r => r.company));
  return ["all", ...Array.from(companySet).sort()];
});

const filteredRecommendations = computed(() => {
  let filtered = props.recommendations;

  // Filter by company
  if (selectedCompany.value !== "all") {
    filtered = filtered.filter(r => r.company === selectedCompany.value);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.company.toLowerCase().includes(query) ||
        r.testimonial.toLowerCase().includes(query),
    );
  }

  // Sort by date (newest first)
  return [...filtered].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

const hasRecommendations = computed(() => filteredRecommendations.value.length > 0);

// --- Utility Functions ---
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Date not specified";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getItemKey = (item: Recommendation): string => item.id;
</script>

<template>
  <div class="recommendations-container">
    <!-- Filters Section -->
    <div class="filters-section">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search recommendations..."
          class="search-input"
        />
      </div>

      <div class="company-filter">
        <label for="company-select" class="filter-label">Filter by company:</label>
        <select id="company-select" v-model="selectedCompany" class="company-select">
          <option v-for="company in companies" :key="company" :value="company">
            {{ company === "all" ? "All Companies" : company }}
          </option>
        </select>
      </div>
    </div>

    <!-- Results Count -->
    <div v-if="searchQuery || selectedCompany !== 'all'" class="results-count">
      Showing {{ filteredRecommendations.length }} recommendation{{
        filteredRecommendations.length !== 1 ? "s" : ""
      }}
    </div>

    <!-- Recommendations List -->
    <div v-if="hasRecommendations" class="recommendations-list">
      <div
        v-for="item in filteredRecommendations"
        :key="getItemKey(item)"
        class="recommendation-card"
      >
        <div class="card-header">
          <div class="card-avatar">
            {{ item.name.charAt(0) }}
          </div>
          <div class="card-info">
            <h3 class="card-name">{{ item.name }}</h3>
            <p class="card-title">{{ item.title }}</p>
            <p class="card-company">{{ item.company }}</p>
          </div>
        </div>

        <div class="card-body">
          <p class="card-testimonial">{{ item.testimonial }}</p>
        </div>

        <div v-if="item.date" class="card-footer">
          <time class="card-date">{{ formatDate(item.date) }}</time>
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-else class="no-results">
      <p>No recommendations found matching your criteria.</p>
    </div>
  </div>
</template>

<style scoped>
.recommendations-container {
  max-width: 100%;
  margin: 2rem 0;
}

/* Filters Section */
.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.search-box {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.company-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.company-select {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.company-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

/* Results Count */
.results-count {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

/* Recommendations List */
.recommendations-list {
  display: grid;
  gap: 1.5rem;
}

.recommendation-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px var(--vp-c-brand-soft);
  transform: translateY(-2px);
}

/* Card Header */
.card-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-avatar {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-brand-1);
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 50%;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem 0;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin: 0 0 0.125rem 0;
}

.card-company {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--vp-c-brand-1);
  margin: 0;
}

/* Card Body */
.card-body {
  margin-bottom: 1rem;
}

.card-testimonial {
  font-size: 1rem;
  line-height: 1.625rem;
  color: var(--vp-c-text-2);
  margin: 0;
  text-align: left;
}

/* Card Footer */
.card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.card-date {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-2);
}

/* Responsive Design */
@media (min-width: 768px) {
  .filters-section {
    flex-direction: row;
    align-items: flex-end;
  }

  .search-box {
    flex: 2;
  }

  .company-filter {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
