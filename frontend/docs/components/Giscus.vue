<template>
  <div class="giscus-wrapper" :class="{ dark: isDark, loaded: isLoaded }">
    <!-- Loading skeleton — shown until the iframe is confirmed in the DOM -->
    <div v-if="!isLoaded" class="giscus-loading">
      <div class="giscus-skeleton">
        <div class="skeleton-input"></div>
        <div class="skeleton-comment">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>
        <div class="skeleton-comment">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line long"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Giscus mount point -->
    <div ref="giscusRef" class="giscus"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, nextTick } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const giscusRef = ref<HTMLElement>();
const isLoaded = ref(false);

// ── SSR guard ────────────────────────────────────────────────────────────────
// All browser APIs (Blob, URL, IntersectionObserver, MutationObserver,
// document, window) are unavailable in Node during SSR/SSG. Every usage
// is either inside onMounted (client-only) or guarded explicitly below.
const isBrowser = typeof window !== "undefined";

// ── Blob URL management ──────────────────────────────────────────────────────
// One Blob URL per theme, created on mount and revoked on unmount.
// Typed as string (not null) after mount — guarded by isBrowser before use.
let lightBlobUrl = "";
let darkBlobUrl  = "";

const makeBlobUrl = (css: string): string => {
  const blob = new Blob([css], { type: "text/css" });
  return URL.createObjectURL(blob);
};

const revokeBlobUrls = () => {
  if (lightBlobUrl) { URL.revokeObjectURL(lightBlobUrl); lightBlobUrl = ""; }
  if (darkBlobUrl)  { URL.revokeObjectURL(darkBlobUrl);  darkBlobUrl  = ""; }
};

// Returns empty string on SSR — callers only run on client so this is safe.
const getThemeUrl = (dark: boolean): string => dark ? darkBlobUrl : lightBlobUrl;

// ── Theme CSS — dark ─────────────────────────────────────────────────────────
// Design tokens:
//   Brand blue   #0066b2  /  readable accent #3b9eff
//   Glass bg     rgba(17,24,39,0.00) — wrapper provides the glass panel
//   Text         #e8edf2  /  muted #9ca3af
const DARK_CSS = `
/*!
 * Glassmorphic dark theme for giscus — stevanussatria.com
 * Based on GitHub Dark Dimmed token structure.
 */
main {
  /* Syntax highlighting — Dark Dimmed */
  --color-prettylights-syntax-comment:#768390;
  --color-prettylights-syntax-constant:#6cb6ff;
  --color-prettylights-syntax-entity:#dcbdfb;
  --color-prettylights-syntax-storage-modifier-import:#adbac7;
  --color-prettylights-syntax-entity-tag:#8ddb8c;
  --color-prettylights-syntax-keyword:#f47067;
  --color-prettylights-syntax-string:#96d0ff;
  --color-prettylights-syntax-variable:#f69d50;
  --color-prettylights-syntax-brackethighlighter-unmatched:#e5534b;
  --color-prettylights-syntax-invalid-illegal-text:#cdd9e5;
  --color-prettylights-syntax-invalid-illegal-bg:#922323;
  --color-prettylights-syntax-carriage-return-text:#cdd9e5;
  --color-prettylights-syntax-carriage-return-bg:#ad2e2c;
  --color-prettylights-syntax-string-regexp:#8ddb8c;
  --color-prettylights-syntax-markup-list:#eac55f;
  --color-prettylights-syntax-markup-heading:#6cb6ff;
  --color-prettylights-syntax-markup-italic:#adbac7;
  --color-prettylights-syntax-markup-bold:#adbac7;
  --color-prettylights-syntax-markup-deleted-text:#ffd8d3;
  --color-prettylights-syntax-markup-deleted-bg:#78191b;
  --color-prettylights-syntax-markup-inserted-text:#b4f1b4;
  --color-prettylights-syntax-markup-inserted-bg:#1b4721;
  --color-prettylights-syntax-markup-changed-text:#ffddb0;
  --color-prettylights-syntax-markup-changed-bg:#682d0f;
  --color-prettylights-syntax-markup-ignored-text:#adbac7;
  --color-prettylights-syntax-markup-ignored-bg:#255ab2;
  --color-prettylights-syntax-meta-diff-range:#dcbdfb;
  --color-prettylights-syntax-brackethighlighter-angle:#768390;
  --color-prettylights-syntax-sublimelinter-gutter-mark:#545d68;
  --color-prettylights-syntax-constant-other-reference-link:#96d0ff;

  /* Buttons */
  --color-btn-text:#d0d7e0;
  --color-btn-bg:rgba(255,255,255,0.06);
  --color-btn-border:rgba(255,255,255,0.10);
  --color-btn-shadow:none;
  --color-btn-inset-shadow:none;
  --color-btn-hover-bg:rgba(255,255,255,0.10);
  --color-btn-hover-border:rgba(255,255,255,0.18);
  --color-btn-active-bg:rgba(255,255,255,0.08);
  --color-btn-active-border:rgba(255,255,255,0.14);
  --color-btn-selected-bg:rgba(0,102,178,0.20);

  /* Primary button — brand blue */
  --color-btn-primary-text:#ffffff;
  --color-btn-primary-bg:rgba(0,102,178,0.80);
  --color-btn-primary-border:rgba(0,102,178,0.40);
  --color-btn-primary-shadow:none;
  --color-btn-primary-inset-shadow:none;
  --color-btn-primary-hover-bg:rgba(0,102,178,0.95);
  --color-btn-primary-hover-border:rgba(59,158,255,0.50);
  --color-btn-primary-selected-bg:rgba(0,102,178,0.90);
  --color-btn-primary-selected-shadow:none;
  --color-btn-primary-disabled-text:rgba(255,255,255,0.40);
  --color-btn-primary-disabled-bg:rgba(0,102,178,0.35);
  --color-btn-primary-disabled-border:rgba(0,102,178,0.20);

  /* Segmented control */
  --color-action-list-item-default-hover-bg:rgba(255,255,255,0.06);
  --color-segmented-control-bg:rgba(255,255,255,0.05);
  --color-segmented-control-button-bg:rgba(255,255,255,0.08);
  --color-segmented-control-button-selected-border:rgba(255,255,255,0.18);

  /* Foreground */
  --color-fg-default:#e8edf2;
  --color-fg-muted:#9ca3af;
  --color-fg-subtle:#6b7280;

  /* Canvas — fully transparent so the Vue wrapper glass shows through */
  --color-canvas-default:rgba(17,24,39,0.00);
  --color-canvas-overlay:rgba(17,24,39,0.85);
  --color-canvas-inset:rgba(10,15,25,0.40);
  --color-canvas-subtle:rgba(255,255,255,0.03);

  /* Borders */
  --color-border-default:rgba(255,255,255,0.10);
  --color-border-muted:rgba(255,255,255,0.06);
  --color-neutral-muted:rgba(255,255,255,0.08);

  /* Accents */
  --color-accent-fg:#3b9eff;
  --color-accent-emphasis:#0066b2;
  --color-accent-muted:rgba(59,158,255,0.25);
  --color-accent-subtle:rgba(0,102,178,0.12);

  /* States */
  --color-success-fg:#4ade80;
  --color-attention-fg:#f59e0b;
  --color-attention-muted:rgba(245,158,11,0.30);
  --color-attention-subtle:rgba(245,158,11,0.12);
  --color-danger-fg:#f87171;
  --color-danger-muted:rgba(248,113,113,0.30);
  --color-danger-subtle:rgba(248,113,113,0.12);

  --color-primer-shadow-inset:0 0 #0000;
  --color-scale-gray-7:rgba(255,255,255,0.06);
  --color-scale-blue-8:rgba(0,102,178,0.20);
  --color-social-reaction-bg-hover:var(--color-scale-gray-7);
  --color-social-reaction-bg-reacted-hover:var(--color-scale-blue-8);
}

main .pagination-loader-container {
  background-image: url(https://github.com/images/modules/pulls/progressive-disclosure-line-dark.svg);
}
main .gsc-loading-image {
  background-image: url(https://github.githubassets.com/images/mona-loading-dimmed.gif);
}

.gsc-homepage-bg { background: transparent; }

.gsc-comment-box {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.gsc-comment-box-tabs {
  border-bottom-color: rgba(255,255,255,0.08);
  background: transparent;
}
.gsc-comment-box-tab-link { color: #9ca3af; }
.gsc-comment-box-tab-link.selected,
.gsc-comment-box-tab-link:hover { color: #e8edf2; border-bottom-color: #3b9eff; }
.gsc-comment-box-textarea {
  background: rgba(255,255,255,0.03);
  color: #e8edf2;
  border-color: rgba(255,255,255,0.08);
  border-radius: 8px;
}
.gsc-comment-box-textarea:focus {
  border-color: rgba(59,158,255,0.50);
  box-shadow: 0 0 0 3px rgba(0,102,178,0.20);
  outline: none;
}
.gsc-comment-box-textarea-extras {
  border-top-color: rgba(255,255,255,0.06);
  background: transparent;
}

.gsc-comment {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.gsc-comment-header {
  background: rgba(255,255,255,0.04);
  border-bottom-color: rgba(255,255,255,0.06);
  border-radius: 12px 12px 0 0;
}
.gsc-comment-content { color: #d0d7e0; }
.gsc-comment-footer { border-top-color: rgba(255,255,255,0.06); }
.gsc-reply {
  background: rgba(255,255,255,0.02);
  border-top: 1px solid rgba(255,255,255,0.06);
}

.gsc-social-reaction-summary-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
}
.gsc-social-reaction-summary-item:hover {
  background: rgba(59,158,255,0.12);
  border-color: rgba(59,158,255,0.25);
}
.gsc-social-reaction-summary-item.has-reacted {
  background: rgba(0,102,178,0.20);
  border-color: rgba(59,158,255,0.35);
}

.gsc-pagination-button {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 8px;
  color: #d0d7e0;
}
.gsc-pagination-button:hover {
  background: rgba(59,158,255,0.12);
  border-color: rgba(59,158,255,0.25);
}

.gsc-header { padding-bottom: 1rem; color: #9ca3af; }
.gsc-timeline { flex-direction: column-reverse; }
.gsc-comments > .gsc-header  { order: 1; }
.gsc-comments > .gsc-comment-box { margin-bottom: 1rem; order: 2; }
.gsc-comments > .gsc-timeline { order: 3; }
.gsc-reactions-count { display: none; }
`;

// ── Theme CSS — light ────────────────────────────────────────────────────────
// Design tokens:
//   Brand blue   #0066b2
//   Glass bg     rgba(255,255,255,0.00) — wrapper provides the glass panel
//   Text         #111827  /  muted #6b7280
const LIGHT_CSS = `
/*!
 * Glassmorphic light theme for giscus — stevanussatria.com
 * Based on GitHub Light token structure.
 */
main {
  /* Syntax highlighting — GitHub Light */
  --color-prettylights-syntax-comment:#6e7781;
  --color-prettylights-syntax-constant:#0550ae;
  --color-prettylights-syntax-entity:#8250df;
  --color-prettylights-syntax-storage-modifier-import:#24292f;
  --color-prettylights-syntax-entity-tag:#116329;
  --color-prettylights-syntax-keyword:#cf222e;
  --color-prettylights-syntax-string:#0a3069;
  --color-prettylights-syntax-variable:#953800;
  --color-prettylights-syntax-brackethighlighter-unmatched:#82071e;
  --color-prettylights-syntax-invalid-illegal-text:#f6f8fa;
  --color-prettylights-syntax-invalid-illegal-bg:#82071e;
  --color-prettylights-syntax-carriage-return-text:#f6f8fa;
  --color-prettylights-syntax-carriage-return-bg:#cf222e;
  --color-prettylights-syntax-string-regexp:#116329;
  --color-prettylights-syntax-markup-list:#3b2300;
  --color-prettylights-syntax-markup-heading:#0550ae;
  --color-prettylights-syntax-markup-italic:#24292f;
  --color-prettylights-syntax-markup-bold:#24292f;
  --color-prettylights-syntax-markup-deleted-text:#82071e;
  --color-prettylights-syntax-markup-deleted-bg:#ffebe9;
  --color-prettylights-syntax-markup-inserted-text:#116329;
  --color-prettylights-syntax-markup-inserted-bg:#dafbe1;
  --color-prettylights-syntax-markup-changed-text:#953800;
  --color-prettylights-syntax-markup-changed-bg:#ffd8b5;
  --color-prettylights-syntax-markup-ignored-text:#eaeef2;
  --color-prettylights-syntax-markup-ignored-bg:#0550ae;
  --color-prettylights-syntax-meta-diff-range:#8250df;
  --color-prettylights-syntax-brackethighlighter-angle:#57606a;
  --color-prettylights-syntax-sublimelinter-gutter-mark:#8c959f;
  --color-prettylights-syntax-constant-other-reference-link:#0a3069;

  /* Buttons */
  --color-btn-text:#24292f;
  --color-btn-bg:rgba(255,255,255,0.70);
  --color-btn-border:rgba(0,0,0,0.12);
  --color-btn-shadow:0 1px 2px rgba(0,0,0,0.06);
  --color-btn-inset-shadow:none;
  --color-btn-hover-bg:rgba(255,255,255,0.90);
  --color-btn-hover-border:rgba(0,0,0,0.18);
  --color-btn-active-bg:rgba(240,244,248,0.90);
  --color-btn-active-border:rgba(0,0,0,0.15);
  --color-btn-selected-bg:rgba(0,102,178,0.08);

  /* Primary button — brand blue */
  --color-btn-primary-text:#ffffff;
  --color-btn-primary-bg:rgba(0,102,178,0.88);
  --color-btn-primary-border:rgba(0,102,178,0.40);
  --color-btn-primary-shadow:0 1px 3px rgba(0,102,178,0.20);
  --color-btn-primary-inset-shadow:none;
  --color-btn-primary-hover-bg:#0066b2;
  --color-btn-primary-hover-border:rgba(0,80,140,0.50);
  --color-btn-primary-selected-bg:rgba(0,80,140,0.90);
  --color-btn-primary-selected-shadow:none;
  --color-btn-primary-disabled-text:rgba(255,255,255,0.60);
  --color-btn-primary-disabled-bg:rgba(0,102,178,0.40);
  --color-btn-primary-disabled-border:rgba(0,102,178,0.20);

  /* Segmented control */
  --color-action-list-item-default-hover-bg:rgba(0,102,178,0.06);
  --color-segmented-control-bg:rgba(0,0,0,0.04);
  --color-segmented-control-button-bg:rgba(255,255,255,0.80);
  --color-segmented-control-button-selected-border:rgba(0,0,0,0.15);

  /* Foreground */
  --color-fg-default:#111827;
  --color-fg-muted:#6b7280;
  --color-fg-subtle:#9ca3af;

  /* Canvas — fully transparent so the Vue wrapper glass shows through */
  --color-canvas-default:rgba(255,255,255,0.00);
  --color-canvas-overlay:rgba(255,255,255,0.90);
  --color-canvas-inset:rgba(240,244,248,0.60);
  --color-canvas-subtle:rgba(0,102,178,0.03);

  /* Borders */
  --color-border-default:rgba(0,0,0,0.10);
  --color-border-muted:rgba(0,0,0,0.06);
  --color-neutral-muted:rgba(0,0,0,0.06);

  /* Accents */
  --color-accent-fg:#0066b2;
  --color-accent-emphasis:#0055a0;
  --color-accent-muted:rgba(0,102,178,0.20);
  --color-accent-subtle:rgba(0,102,178,0.06);

  /* States */
  --color-success-fg:#16a34a;
  --color-attention-fg:#d97706;
  --color-attention-muted:rgba(217,119,6,0.25);
  --color-attention-subtle:rgba(217,119,6,0.08);
  --color-danger-fg:#dc2626;
  --color-danger-muted:rgba(220,38,38,0.25);
  --color-danger-subtle:rgba(220,38,38,0.08);

  --color-primer-shadow-inset:inset 0 1px 2px rgba(0,0,0,0.06);
  --color-scale-gray-7:rgba(0,0,0,0.05);
  --color-scale-blue-8:rgba(0,102,178,0.10);
  --color-social-reaction-bg-hover:var(--color-scale-gray-7);
  --color-social-reaction-bg-reacted-hover:var(--color-scale-blue-8);
}

main .pagination-loader-container {
  background-image: url(https://github.com/images/modules/pulls/progressive-disclosure-line.svg);
}
main .gsc-loading-image {
  background-image: url(https://github.githubassets.com/images/mona-loading-default.gif);
}

.gsc-homepage-bg { background: transparent; }

.gsc-comment-box {
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.70);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0,102,178,0.06), inset 0 1px 0 rgba(255,255,255,0.60);
}
.gsc-comment-box-tabs {
  border-bottom-color: rgba(0,0,0,0.06);
  background: transparent;
}
.gsc-comment-box-tab-link { color: #6b7280; }
.gsc-comment-box-tab-link.selected,
.gsc-comment-box-tab-link:hover { color: #111827; border-bottom-color: #0066b2; }
.gsc-comment-box-textarea {
  background: rgba(255,255,255,0.70);
  color: #111827;
  border-color: rgba(0,0,0,0.08);
  border-radius: 8px;
}
.gsc-comment-box-textarea:focus {
  border-color: rgba(0,102,178,0.40);
  box-shadow: 0 0 0 3px rgba(0,102,178,0.12);
  outline: none;
}
.gsc-comment-box-textarea-extras {
  border-top-color: rgba(0,0,0,0.05);
  background: transparent;
}

.gsc-comment {
  background: rgba(255,255,255,0.50);
  border: 1px solid rgba(255,255,255,0.65);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 8px rgba(0,102,178,0.05), inset 0 1px 0 rgba(255,255,255,0.55);
}
.gsc-comment-header {
  background: rgba(255,255,255,0.40);
  border-bottom-color: rgba(0,0,0,0.05);
  border-radius: 12px 12px 0 0;
}
.gsc-comment-content { color: #1f2937; }
.gsc-comment-footer { border-top-color: rgba(0,0,0,0.05); }
.gsc-reply {
  background: rgba(255,255,255,0.35);
  border-top: 1px solid rgba(0,0,0,0.05);
}

.gsc-social-reaction-summary-item {
  background: rgba(255,255,255,0.60);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 20px;
}
.gsc-social-reaction-summary-item:hover {
  background: rgba(0,102,178,0.08);
  border-color: rgba(0,102,178,0.20);
}
.gsc-social-reaction-summary-item.has-reacted {
  background: rgba(0,102,178,0.10);
  border-color: rgba(0,102,178,0.30);
}

.gsc-pagination-button {
  background: rgba(255,255,255,0.65);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  color: #374151;
}
.gsc-pagination-button:hover {
  background: rgba(0,102,178,0.08);
  border-color: rgba(0,102,178,0.20);
}

.gsc-header { padding-bottom: 1rem; color: #6b7280; }
.gsc-timeline { flex-direction: column-reverse; }
.gsc-comments > .gsc-header  { order: 1; }
.gsc-comments > .gsc-comment-box { margin-bottom: 1rem; order: 2; }
.gsc-comments > .gsc-timeline { order: 3; }
.gsc-reactions-count { display: none; }
`;

// ── Cleanup refs — all tracked for safe teardown on unmount ─────────────────
let intersectionObserver: IntersectionObserver | null = null;
let mutationObserver: MutationObserver | null = null;
// ReturnType<typeof setTimeout> works correctly in both browser and Node
let themeDebounce: ReturnType<typeof setTimeout> | null = null;

const cleanup = () => {
  intersectionObserver?.disconnect();
  intersectionObserver = null;

  mutationObserver?.disconnect();
  mutationObserver = null;

  if (themeDebounce !== null) {
    clearTimeout(themeDebounce);
    themeDebounce = null;
  }

  revokeBlobUrls();
};

// ── Wait for Giscus iframe via MutationObserver ──────────────────────────────
// Replaces the fragile 300ms setTimeout. Watches the mount div for the
// iframe Giscus injects, then marks isLoaded once it appears.
const waitForIframe = () => {
  if (!giscusRef.value) return;

  mutationObserver = new MutationObserver(() => {
    const iframe = giscusRef.value?.querySelector("iframe.giscus-frame");
    if (iframe) {
      mutationObserver?.disconnect();
      mutationObserver = null;
      isLoaded.value = true;
    }
  });

  mutationObserver.observe(giscusRef.value, { childList: true, subtree: true });
};

// ── Giscus script injection ──────────────────────────────────────────────────
const loadGiscus = async () => {
  await nextTick();
  if (!giscusRef.value) return;

  // Guard against duplicate injection on SPA re-navigation (Bug 6).
  // If a script or iframe is already present, bail out.
  if (giscusRef.value.querySelector("script,iframe")) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", "stevahnes/stevanussatria.com");
  script.setAttribute("data-repo-id", "R_kgDOObyIyA");
  script.setAttribute("data-mapping", "number");
  script.setAttribute("data-term", "128");
  script.setAttribute("data-reactions-enabled", "0");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", getThemeUrl(isDark.value));
  script.setAttribute("data-lang", "en");
  script.crossOrigin = "anonymous";
  script.async = true;

  // Start watching for the iframe before appending the script,
  // so we never miss the injection event.
  waitForIframe();

  giscusRef.value.appendChild(script);
};

// ── Intersection observer — lazy load ───────────────────────────────────────
const observeGiscus = () => {
  if (!giscusRef.value) return;

  intersectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          intersectionObserver?.disconnect();
          intersectionObserver = null;
          loadGiscus();
        }
      });
    },
    { rootMargin: "100px", threshold: 0.1 },
  );

  intersectionObserver.observe(giscusRef.value);
};

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  // Blob and IntersectionObserver are browser-only — safe here since
  // onMounted never runs during SSR.
  lightBlobUrl = makeBlobUrl(LIGHT_CSS);
  darkBlobUrl  = makeBlobUrl(DARK_CSS);
  observeGiscus();
});

onUnmounted(() => {
  // Cleans up all observers, pending timeouts, and Blob URLs.
  cleanup();
});

// ── Theme switching ──────────────────────────────────────────────────────────
watch(isDark, newVal => {
  // isBrowser guard: watch callbacks can fire during SSR in some edge cases
  if (!isBrowser) return;

  if (themeDebounce !== null) clearTimeout(themeDebounce);

  themeDebounce = setTimeout(() => {
    themeDebounce = null;
    const iframe = document.querySelector("iframe.giscus-frame") as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: getThemeUrl(newVal) } } },
        "https://giscus.app",
      );
    }
  }, 100);
});
</script>

<style scoped>
/* ── Wrapper — matches the site's glass panel system ── */
.giscus-wrapper {
  position: relative;
  border-radius: var(--glass-radius, 16px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.18));
  background: var(--glass-bg, rgba(255, 255, 255, 0.08));
  backdrop-filter: blur(var(--glass-blur, 20px)) saturate(1.6);
  -webkit-backdrop-filter: blur(var(--glass-blur, 20px)) saturate(1.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 24px;
  transition: border-color 0.3s, background 0.3s;
}

:root:not(.dark) .giscus-wrapper {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.70);
  box-shadow: 0 4px 24px rgba(0, 102, 178, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* ── Loading skeleton ── */
.giscus-loading {
  padding: 4px 0 8px;
}

.giscus-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-input {
  width: 100%;
  height: 80px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.14);
  animation: shimmer 1.8s ease-in-out infinite;
}

:root:not(.dark) .skeleton-input {
  background: rgba(0, 102, 178, 0.06);
  border-color: rgba(0, 102, 178, 0.10);
}

.skeleton-comment {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.12);
  animation: shimmer 1.8s ease-in-out infinite;
  animation-delay: 0.15s;
}

:root:not(.dark) .skeleton-avatar {
  background: rgba(0, 102, 178, 0.08);
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.10);
  animation: shimmer 1.8s ease-in-out infinite;
  animation-delay: 0.3s;
}

:root:not(.dark) .skeleton-line {
  background: rgba(0, 102, 178, 0.06);
}

.skeleton-line.short  { width: 40%; }
.skeleton-line.medium { width: 65%; }
.skeleton-line.long   { width: 90%; }

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ── Giscus iframe ── */
.giscus :deep(iframe.giscus-frame) {
  width: 100%;
  border: none;
  border-radius: calc(var(--glass-radius, 16px) - 4px);
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
  color-scheme: light dark;
}

/* Fade in only once isLoaded is true — .loaded is toggled by the MutationObserver */
.giscus-wrapper.loaded :deep(iframe.giscus-frame) {
  opacity: 1;
}
</style>