<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import FloatingMusicPlayer from "./components/SoundCloudPlayer.vue";
import UnifiedChat from "./components/Chat.vue";
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <FloatingMusicPlayer
        :playlist-url="'https://soundcloud.com/stevanus-satria/sets/piano-covers'"
      />
      <UnifiedChat />
    </template>
  </DefaultTheme.Layout>
</template>
