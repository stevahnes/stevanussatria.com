<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";

const FloatingMusicPlayer = defineAsyncComponent(() => import("./components/SoundCloudPlayer.vue"));
const UnifiedChat = defineAsyncComponent(() => import("./components/Chat.vue"));
const ShaderBackground = defineAsyncComponent(() => import("./components/ShaderBackground.vue"));
const Console = defineAsyncComponent(() => import("./components/Console.vue"));

const { page } = useData();
const isHome = computed(() => page.value.relativePath === "index.md");
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-before>
      <ShaderBackground v-if="isHome" />
    </template>
    <template #layout-bottom>
      <FloatingMusicPlayer
        :playlist-url="'https://soundcloud.com/stevanus-satria/sets/piano-covers'"
      />
      <UnifiedChat />
      <Console />
    </template>
  </DefaultTheme.Layout>
</template>
