<template>
  <div class="giscus-container">
    <!-- Loading placeholder -->
    <div v-if="!isLoaded" class="giscus-loading">
      <div class="loading-skeleton"></div>
    </div>
    <div ref="giscusRef" class="giscus"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const giscusRef = ref<HTMLElement>();
const isLoaded = ref(false);

const loadGiscus = async () => {
  await nextTick(); // Ensure DOM is ready

  if (!giscusRef.value) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", "stevahnes/vitepress-portfolio");
  script.setAttribute("data-repo-id", "R_kgDOObyIyA");
  script.setAttribute("data-mapping", "number");
  script.setAttribute("data-term", "128");
  script.setAttribute("data-reactions-enabled", "0");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", isDark.value ? "dark" : "light");
  script.setAttribute("data-lang", "en");
  script.setAttribute("data-loading", "lazy"); // Enable lazy loading
  script.crossOrigin = "anonymous";
  script.async = true;

  // Listen for when Giscus is loaded
  script.onload = () => {
    isLoaded.value = true;
  };

  giscusRef.value.appendChild(script);
};

// Intersection Observer for lazy loading
const observeGiscus = () => {
  if (!giscusRef.value) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadGiscus();
          observer.disconnect(); // Stop observing once loaded
        }
      });
    },
    {
      rootMargin: "100px", // Start loading 100px before it comes into view
      threshold: 0.1,
    },
  );

  observer.observe(giscusRef.value);
};

onMounted(() => {
  // Use intersection observer for lazy loading
  observeGiscus();
});

// Optimized theme switching with debouncing
let themeUpdateTimeout: number;
watch(isDark, newVal => {
  clearTimeout(themeUpdateTimeout);
  themeUpdateTimeout = window.setTimeout(() => {
    const iframe = document.querySelector("iframe.giscus-frame") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: newVal ? "dark" : "light" } } },
        "https://giscus.app",
      );
    }
  }, 100); // Debounce theme changes
});
</script>

<style scoped>
.giscus-container {
  min-height: 200px;
  /* Reserve space to prevent layout shift */
  position: relative;
}

.giscus-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.loading-skeleton {
  width: 100%;
  height: 150px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

.giscus-container.dark .loading-skeleton {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* Hide loading when Giscus is loaded */
.giscus iframe {
  transition: opacity 0.3s ease-in-out;
}
</style>
