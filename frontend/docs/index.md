---
layout: home
title: "Home"
description: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 8+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
keywords: "Stevanus Satria, product manager, software engineer, Workato, Airwallex, B2B SaaS, frontend developer, Singapore, portfolio"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Home"
  - - meta
    - property: og:description
      content: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 8+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:url
      content: https://stevanussatria.com
  - - meta
    - name: twitter:title
      content: "Home"
  - - meta
    - name: twitter:description
      content: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 8+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - link
    - rel: canonical
      href: https://stevanussatria.com

hero:
  name: "Stevanus Satria"
  text: "Product Manager"
  image:
    src: /me.webp
    alt: Stevanus Satria
  actions:
    - theme: brand
      text: Let's Chat
      link: "#chat"
    - theme: alt
      text: Download Resume
      link: /resume?auto=true

features:
  - title: ⌛ 8+
    details: Years of Experience
  - title: 💳 Fintech
    details: Primary Domain Expertise
  - title: ☁️ SaaS/Cloud
    details: Primary Architecture Expertise
---

<script setup lang="ts">
import { onMounted } from 'vue'
import { defineAsyncComponent } from 'vue'
const ContactChatLink = defineAsyncComponent(() => 
  import('./components/ContactChatLink.vue')
)

onMounted(() => {
  const chatButton = document.querySelector('a[href="#chat"]')
  
  if (chatButton) {
    chatButton.removeAttribute('href')
    chatButton.setAttribute('role', 'button')
    chatButton.style.cursor = 'pointer'
    chatButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('activateChat', {
        detail: {
          message: "I'd like to schedule a chat with Steve!"
        }
      }))
    })
  }
})
</script>

## Hi, I'm Steve 👋

I'm a **product manager**, **frontend developer**, **fitness enthusiast**, and **casual pianist**.

I'm currently a **Senior Product Manager** at [Airwallex](https://airwallex.com), where I expand our payment plugin coverage and drive global adoption of Airwallex-built integrations. Beyond building integrations and new product capabilities, I also write about [checkout optimization](https://www.airwallex.com/global/blog/airwallex-additional-payments-shopify-local-payment-methods), helping merchants improve their checkout experience while strengthening our product positioning.

Previously, I was a **Senior Product Manager** at [Workato](https://www.workato.com), where I managed a suite of platform connectors and stateful data storage solutions. I modernized legacy systems and led cross-functional teams from product vision through execution. Before that, I was a **Product Manager** at [Shopee](https://shopee.sg), improving the buyer-seller chat experience across mobile and web platforms.

Before moving into product management, I spent three years as a **Software Engineer** at [Amadeus](https://www.amadeus.com). There, I modernized the Airport Management System's dashboard and reporting module, improved messaging system stability, and built productivity tools. My [Figma plugins](https://www.figma.com/@stevahnes) have reached more than 40,000 users and received 250 likes.

I started my career as a **Graduate Software Engineer** at [Works Applications](https://www.worksap.sg/). After earning a Bachelor of Engineering (Product Development) from [SUTD](https://www.sutd.edu.sg/), I spent a year as a **Research Officer**. My research on using impulse shaping to suppress oscillations in spherical rolling robots was [published](https://ieeexplore.ieee.org/document/8014259) at the IEEE Advanced Intelligent Mechatronics (AIM) Conference in 2017.

Outside of work, I enjoy **cycling**, **practicing yoga and Pilates**, **hitting the gym**, and **going on relaxed 30-minute runs**. My longest ride to date was a [120 km loop around Singapore](https://www.strava.com/activities/11811566357), while my most challenging ride to date was a triple climb of [Page Mill Rd, Pescadero, and Tunitas Creek](https://www.strava.com/activities/12183241879) in the Bay Area.

I also enjoy **playing the piano** in my spare time. During the COVID-19 lockdowns, I challenged myself to record **30 covers in 30 days**, which I compiled into a [playlist on SoundCloud](https://soundcloud.com/stevanus-satria/sets/piano-covers).

Whether I'm building products, writing code, cycling, or playing the piano, I enjoy solving problems, learning new skills, and building things that people find useful.

Want to connect? I'd love to chat about product, technology, fitness, music, or anything else we might have in common. Ask <ContactChatLink message="I'd like to get in touch with Steve!">Advocado</ContactChatLink> to help you get in touch!
