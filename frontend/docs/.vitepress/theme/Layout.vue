<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import FloatingMusicPlayer from "./components/SoundCloudPlayer.vue";
import UnifiedChat from "./components/Chat.vue";
import ShaderBackground from "./components/ShaderBackground.vue";
// Only show shader on the home page hero
const { page } = useData();
// True only when the frontmatter layout is 'home' AND it's the root index
const isHome = computed(() => page.value.relativePath === "index.md");
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
