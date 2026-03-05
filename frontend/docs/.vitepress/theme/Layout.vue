<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import DefaultTheme from "vitepress/theme";
import FloatingMusicPlayer from "./components/SoundCloudPlayer.vue";
import UnifiedChat from "./components/Chat.vue";
import ShaderBackground from "./components/ShaderBackground.vue";
// Only show shader on the home page hero
const isHome = ref(false);

function checkRoute() {
  isHome.value =
    typeof window !== "undefined" &&
    (window.location.pathname === "/" || window.location.pathname === "/index.html");
}

onMounted(() => {
  checkRoute();
  window.addEventListener("popstate", checkRoute);
});

onUnmounted(() => {
  window.removeEventListener("popstate", checkRoute);
});
</script>

<template>
  <DefaultTheme.Layout>
    <!-- Shader replaces the hero radial gradient background -->
    <template #home-hero-before>
      <ShaderBackground v-if="isHome" />
    </template>
    <template #layout-bottom>
      <FloatingMusicPlayer
        :playlist-url="'https://soundcloud.com/stevanus-satria/sets/piano-covers'"
      />
      <UnifiedChat />
    </template>
  </DefaultTheme.Layout>
</template>
