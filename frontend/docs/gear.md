---
layout: home

features:
  - icon: { src: ./omega.png }
    title: Speedy
    details: Omega Speedmaster Moonwatch Professional
  - icon: { src: ./orient.png }
    title: Bambino
    details: Orient Bambino Small Seconds 38mm
  - icon: { src: ./landyachtz.png }
    title: Gyn
    details: Landyachtz Dinghy Gin & Tonic Cruiser
  - icon: { dark: "./polygon-dark.png", light: "./polygon-light.png" }
    title: Zephyr
    details: 2014 Polygon Helios C4.0 | Shimano 105
  - icon: { src: ./aftershock.webp }
    title: Zoom
    details: Aftershock | 5600X | RTX3060
  - icon: { src: ./apple.webp }
    title: Jean
    details: iPhone 13 Pro Max
  - icon: { src: ./google.webp }
    title: Hey, Google!
    details: Google Home Mini
  - icon: { src: ./xiaomi.svg }
    title: Eko
    details: Mi Robot Vacuum-Mop 2
  - icon: { src: ./ewelink.png }
    title: Flip
    details: eWeLink Sonoff Basic Switch
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const MiniChat = defineAsyncComponent(() => 
  import('./components/MiniChat.vue')
)
</script>

<MiniChat />
