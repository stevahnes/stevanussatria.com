<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useData } from "vitepress";

interface SoundCloudSound {
  title: string;
  duration: number;
  user: { username: string };
  id: number;
}
interface SoundCloudWidget {
  bind: (event: string, callback: () => void) => void;
  getCurrentSound: (callback: (sound: SoundCloudSound | null) => void) => void;
  getCurrentSoundIndex: (callback: (index: number) => void) => void;
  getSounds: (callback: (sounds: SoundCloudSound[]) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
  getPosition: (callback: (position: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getVolume: (callback: (volume: number) => void) => void;
  setVolume: (volume: number) => void;
  seekTo: (position: number) => void;
  next: () => void;
  prev: () => void;
  play: () => void;
  pause: () => void;
}
interface SoundCloudWidgetConstructor {
  (iframe: HTMLIFrameElement): SoundCloudWidget;
  Events: { READY: string; PLAY: string; PAUSE: string; FINISH: string; SEEK: string };
}
interface SoundCloudAPI { Widget: SoundCloudWidgetConstructor }
declare global { interface Window { SC: SoundCloudAPI } }

interface Props { playlistUrl?: string }
const props = withDefaults(defineProps<Props>(), {
  playlistUrl: "https://soundcloud.com/stevanus-satria/sets/piano-covers",
});

const isExpanded = ref(false);
const isPlaying = ref(false);
const isLoading = ref(true);
const currentTrack = ref(0);
const currentPosition = ref(0);
const currentDuration = ref(0);
const isClient = ref(false);
const clientSideTheme = ref(false);
const isMuted = ref(false);
const currentTrackTitle = ref("Loading...");
const currentTrackArtist = ref("SoundCloud");
const totalTracks = ref(0);

const playerRef = ref<HTMLDivElement | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const seekBarRef = ref<HTMLDivElement | null>(null);
const titleRef = ref<HTMLDivElement | null>(null);
const artistRef = ref<HTMLDivElement | null>(null);

const { isDark } = useData();
let widget: SoundCloudWidget | null = null;
let positionInterval: number | null = null;

const formattedPosition = computed(() => formatTime(currentPosition.value));
const formattedDuration = computed(() => formatTime(currentDuration.value));
const progressPercentage = computed(() => {
  if (currentDuration.value === 0) return 0;
  return (currentPosition.value / currentDuration.value) * 100;
});

const cssVars = computed(() => ({
  "--player-bg": clientSideTheme.value && isDark.value ? "rgba(17, 24, 39, 0.95)" : "white",
  "--player-border": clientSideTheme.value && isDark.value ? "rgba(75, 85, 99, 0.3)" : "rgba(0, 0, 0, 0.08)",
  "--player-text": clientSideTheme.value && isDark.value ? "#f9fafb" : "#111827",
  "--player-text-secondary": clientSideTheme.value && isDark.value ? "#9ca3af" : "#6b7280",
  "--button-hover-bg": clientSideTheme.value && isDark.value ? "rgba(156, 163, 175, 0.1)" : "rgba(107, 114, 128, 0.1)",
  "--seek-bg": clientSideTheme.value && isDark.value ? "#374151" : "#e5e7eb",
}));

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const loadSoundCloudAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("Not in browser")); return; }
    if (window.SC) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load SoundCloud API"));
    document.head.appendChild(script);
  });
};

const initializeWidget = async (): Promise<void> => {
  if (!isClient.value || !iframeRef.value) return;
  try {
    await loadSoundCloudAPI();
    widget = window.SC.Widget(iframeRef.value);
    widget.bind(window.SC.Widget.Events.READY, () => {
      loadTrackInfo();
      startPositionTracking();
      widget!.getVolume((volume: number) => { isMuted.value = volume === 0; });
      isLoading.value = false;
    });
    widget.bind(window.SC.Widget.Events.PLAY, () => { isPlaying.value = true; startPositionTracking(); });
    widget.bind(window.SC.Widget.Events.PAUSE, () => { isPlaying.value = false; stopPositionTracking(); });
    widget.bind(window.SC.Widget.Events.FINISH, () => {
      isPlaying.value = false;
      stopPositionTracking();
      setTimeout(() => nextTrack(), 500);
    });
    widget.bind(window.SC.Widget.Events.SEEK, () => updatePosition());
    widget.bind("error", () => { isPlaying.value = false; stopPositionTracking(); });
  } catch (error) {
    console.error("Failed to initialize SoundCloud widget:", error);
    isLoading.value = false;
  }
};

const loadTrackInfo = (): void => {
  if (!widget) return;
  widget.getCurrentSound((sound: SoundCloudSound | null) => {
    if (sound) {
      currentTrackTitle.value = sound.title;
      currentTrackArtist.value = sound.user.username;
      currentDuration.value = sound.duration;
      setTimeout(checkTextOverflow, 100);
    }
  });
  widget.getCurrentSoundIndex((index: number) => { currentTrack.value = index; });
  widget.getSounds((sounds: SoundCloudSound[]) => { totalTracks.value = sounds.length; });
};

const updatePosition = (): void => {
  if (!widget) return;
  widget.getPosition((position: number) => {
    currentPosition.value = position;
    if (isPlaying.value && position > 0) {
      widget!.isPaused((paused: boolean) => {
        if (paused && isPlaying.value) { isPlaying.value = false; stopPositionTracking(); }
      });
    }
  });
};

const startPositionTracking = (): void => {
  if (!isClient.value) return;
  stopPositionTracking();
  positionInterval = window.setInterval(updatePosition, 1000);
};

const stopPositionTracking = (): void => {
  if (positionInterval && typeof window !== "undefined") {
    clearInterval(positionInterval);
    positionInterval = null;
  }
};

const togglePlay = (): void => {
  if (!widget) return;
  widget.isPaused((paused: boolean) => { paused ? widget!.play() : widget!.pause(); });
};

const nextTrack = (): void => {
  if (!widget) return;
  widget.next();
  setTimeout(() => {
    loadTrackInfo();
    widget!.isPaused((paused: boolean) => { if (paused) widget!.play(); });
  }, 200);
};

const prevTrack = (): void => {
  if (!widget) return;
  widget.prev();
  setTimeout(() => {
    loadTrackInfo();
    widget!.isPaused((paused: boolean) => { if (paused) widget!.play(); });
  }, 200);
};

const seek = (event: MouseEvent): void => {
  if (!widget || !seekBarRef.value) return;
  const rect = seekBarRef.value.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  widget.seekTo(percentage * currentDuration.value);
};

const toggleMute = (): void => {
  if (!widget) return;
  widget.getVolume((volume: number) => {
    const newVolume = volume > 0 ? 0 : 100;
    isMuted.value = newVolume === 0;
    widget!.setVolume(newVolume);
  });
};

const toggleExpanded = (): void => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) setTimeout(checkTextOverflow, 100);
};

const applyScrollingIfOverflowing = (element: HTMLElement | null): void => {
  if (!element) return;
  const isOverflowing = element.scrollWidth > element.clientWidth;
  if (isOverflowing) {
    element.classList.add("sc-scrolling-text");
    const translateDistance = element.scrollWidth - element.clientWidth + 20;
    element.style.setProperty("--translate-distance", `-${translateDistance}px`);
    element.style.setProperty("--container-width", `${element.clientWidth}px`);
  } else {
    element.classList.remove("sc-scrolling-text");
    element.style.removeProperty("--translate-distance");
    element.style.removeProperty("--container-width");
  }
};

const checkTextOverflow = (): void => {
  if (!isClient.value) return;
  nextTick(() => {
    applyScrollingIfOverflowing(titleRef.value);
    applyScrollingIfOverflowing(artistRef.value);
  });
};

onMounted(() => {
  isClient.value = true;
  clientSideTheme.value = true;
  nextTick(() => initializeWidget());
});

onUnmounted(() => {
  stopPositionTracking();
  if (widget && typeof window !== "undefined") {
    try { widget = null; } catch (error) { console.error("Error cleaning up widget:", error); }
  }
});
</script>

<template>
  <div v-if="isClient" class="sc-player">
    <iframe
      ref="iframeRef"
      :src="`https://w.soundcloud.com/player/?url=${encodeURIComponent(props.playlistUrl)}&auto_play=false&buying=false&liking=false&download=false&sharing=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false&hide_related=true&visual=false&start_track=0&single_active=false`"
      class="sc-iframe"
      width="100"
      height="100"
      allow="autoplay"
    />

    <div ref="playerRef" :class="['sc-player-container', { expanded: isExpanded }]" :style="cssVars">
      <!-- Collapsed View -->
      <div v-if="!isExpanded" class="sc-collapsed" @click="toggleExpanded">
        <div class="sc-music-note">
          <svg viewBox="0 0 24 24" fill="currentColor" class="sc-note-icon">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div v-if="isPlaying" class="sc-playing-indicator">
          <div class="sc-wave"></div>
          <div class="sc-wave"></div>
          <div class="sc-wave"></div>
        </div>
      </div>

      <!-- Expanded View -->
      <div v-else class="sc-expanded">
        <div class="sc-header">
          <div class="sc-header-info">
            <div ref="titleRef" class="sc-title">{{ currentTrackTitle }}</div>
            <div ref="artistRef" class="sc-artist">{{ currentTrackArtist }}</div>
          </div>
          <div class="sc-header-controls">
            <button @click="toggleMute" class="sc-header-btn" :disabled="isLoading" :title="isMuted ? 'Unmute' : 'Mute'">
              <svg v-if="!isMuted" class="sc-icon-small" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <svg v-else class="sc-icon-small" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            </button>
            <button @click="toggleExpanded" class="sc-header-btn">
              <svg class="sc-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        <div class="sc-controls">
          <button @click="prevTrack" class="sc-nav-btn" :disabled="isLoading" title="Previous track">
            <svg class="sc-icon-small" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button @click="togglePlay" class="sc-play-btn" :disabled="isLoading">
            <svg v-if="isLoading" class="sc-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else-if="!isPlaying" class="sc-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="sc-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
          <button @click="nextTrack" class="sc-nav-btn" :disabled="isLoading" title="Next track">
            <svg class="sc-icon-small" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        <div class="sc-progress">
          <div class="sc-time">{{ formattedPosition }}</div>
          <div ref="seekBarRef" class="sc-seek-bar" @click="seek">
            <div class="sc-seek-bg">
              <div class="sc-seek-fill" :style="{ width: `${progressPercentage}%` }" />
            </div>
          </div>
          <div class="sc-time">{{ formattedDuration }}</div>
        </div>

        <div class="sc-track-counter">{{ currentTrack + 1 }} / {{ totalTracks }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sc-player {
  position: fixed;
  bottom: 20px;
  left: max(20px, calc(50vw - 720px));
  z-index: 30;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.sc-iframe {
  position: absolute;
  top: -200px;
  left: -200px;
  width: 100px;
  height: 100px;
  opacity: 0;
  pointer-events: none;
  border: none;
}

.sc-player-container {
  /* Collapsed state: fully transparent so only the .sc-collapsed circle shows */
  background: transparent;
  border-radius: 50%;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  color: var(--player-text);
}

.sc-player-container.expanded {
  width: 320px;
  height: 200px;
  border-radius: var(--glass-radius);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  overflow: hidden;
}

/* ── Collapsed button — glass circle matching shader picker ── */
.sc-collapsed {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
  color: rgba(255, 255, 255, 0.85);
}

.sc-collapsed:hover {
  background: rgba(0, 102, 178, 0.25);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 0 4px 24px rgba(0, 102, 178, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

:root:not(.dark) .sc-collapsed {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.70);
  box-shadow: 0 2px 16px rgba(0, 102, 178, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  color: rgba(0, 60, 120, 0.85);
}

:root:not(.dark) .sc-collapsed:hover {
  background: rgba(0, 102, 178, 0.10);
  border-color: rgba(0, 102, 178, 0.25);
  box-shadow: 0 4px 20px rgba(0, 102, 178, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.sc-music-note {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-note-icon { width: 100%; height: 100%; }

.sc-playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 10px;
  margin-left: 2px;
}

.sc-wave {
  width: 2px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1px;
  animation: wave 1.2s ease-in-out infinite;
}
:root:not(.dark) .sc-wave { background: rgba(0, 102, 178, 0.7); }
.sc-wave:nth-child(1) { height: 4px; animation-delay: 0s; }
.sc-wave:nth-child(2) { height: 10px; animation-delay: 0.2s; }
.sc-wave:nth-child(3) { height: 6px; animation-delay: 0.4s; }

@keyframes wave {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1); }
}

/* Expanded View */
.sc-expanded {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sc-header { display: flex; justify-content: space-between; align-items: flex-start; }
.sc-header-info { flex: 1; min-width: 0; overflow: hidden; position: relative; }

.sc-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--player-text);
  margin-bottom: 4px;
  line-height: 1.3;
  white-space: nowrap;
  position: relative;
}

.sc-artist {
  font-size: 14px;
  color: var(--player-text-secondary);
  white-space: nowrap;
  position: relative;
}

.sc-scrolling-text {
  animation: scroll-text 8s linear infinite;
  animation-delay: 1s;
}
.sc-scrolling-text:hover { animation-play-state: paused; }

@keyframes scroll-text {
  0% { transform: translateX(0); }
  15% { transform: translateX(0); }
  85% { transform: translateX(var(--translate-distance, -100px)); }
  100% { transform: translateX(var(--translate-distance, -100px)); }
}

.sc-header-controls { display: flex; align-items: center; gap: 8px; margin-left: 12px; }

.sc-header-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--player-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sc-header-btn:hover:not(:disabled) { background: var(--button-hover-bg); }
.sc-header-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sc-controls { display: flex; justify-content: center; align-items: center; gap: 16px; }

.sc-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--player-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.sc-nav-btn:hover:not(:disabled) { background: var(--button-hover-bg); color: var(--player-text); }
.sc-nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Play button — glass circle matching shader picker ── */
.sc-play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 102, 178, 0.75);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.sc-play-btn:hover:not(:disabled) {
  background: rgba(0, 102, 178, 0.92);
  box-shadow: 0 4px 20px rgba(0, 102, 178, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

:root:not(.dark) .sc-play-btn {
  background: rgba(0, 102, 178, 0.85);
  border-color: rgba(0, 102, 178, 0.3);
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.sc-play-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.sc-progress { display: flex; align-items: center; gap: 12px; }

.sc-time {
  font-size: 12px;
  color: var(--player-text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
}

.sc-seek-bar {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.sc-seek-bg {
  width: 100%;
  height: 4px;
  background: var(--seek-bg);
  border-radius: 2px;
  overflow: hidden;
}

/* ── Seek fill — brand blue ── */
.sc-seek-fill {
  height: 100%;
  background: rgba(0, 102, 178, 0.80);
  border-radius: 2px;
  transition: width 0.1s linear;
}

:root:not(.dark) .sc-seek-fill {
  background: rgba(0, 102, 178, 0.90);
}

.sc-track-counter { text-align: center; font-size: 12px; color: var(--player-text-secondary); }
.sc-icon { width: 20px; height: 20px; }
.sc-icon-small { width: 16px; height: 16px; }

.sc-spinner { width: 20px; height: 20px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .sc-player { bottom: 16px; left: 16px; }
  .sc-player-container.expanded { width: calc(100vw - 32px); max-width: 320px; }
}
</style>