---
layout: home
title: "Home"
description: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 7+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
keywords: "Stevanus Satria, product manager, software engineer, Workato, Airwallex, B2B SaaS, frontend developer, Singapore, portfolio"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Home"
  - - meta
    - property: og:description
      content: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 7+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
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
      content: "Welcome to Stevanus Satria's portfolio. Senior Product Manager at Airwallex with 7+ years of experience in B2B SaaS, product management, and frontend development. Chat with Advocado, my AI assistant!"
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
  - title: ⌛ 7+
    details: Years of Experience
  - title: 💼 B2B
    details: Primary Domain Expertise
  - title: 🌐 SaaS
    details: Primary Architecture Expertise
---

<script setup lang="ts">
import { onMounted } from 'vue'
import { defineAsyncComponent } from 'vue'
const ContactChatLink = defineAsyncComponent(() => 
  import('./components/ContactChatLink.vue')
)

onMounted(() => {
  // Find the "Let's Chat" button and override its behavior
  const chatButton = document.querySelector('a[href="#chat"]')
  
  if (chatButton) {
    chatButton.addEventListener('click', (e) => {
      e.preventDefault()
      
      // Dispatch the chat activation event
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

I'm a **product manager**, **frontend developer**, **avid cyclist**, and **casual pianist**.

I'm currently a **Senior Product Manager** at [Airwallex](https://airwallex.com), where I manage all payment plugins built by Airwallex.

Previously, I was a **Senior Product Manager** at [Workato](https://www.workato.com), where I manage a suite of platform connectors and stateful data storage solutions, modernizing legacy systems and guiding cross-functional teams from vision to execution. Prior to that, I was a **Product Manager** at [Shopee](https://shopee.sg), improving the buyer-seller chat experience across mobile and web platforms. Before moving into product management, I spent three years as a **Software Engineer** at [Amadeus](https://www.amadeus.com), where I modernized the Airport Management System’s dashboard and reporting module, improved the stability of its messaging system, and built productivity tools including [Figma Plugins](https://www.figma.com/@stevahnes) that reached more than 37,000 users and 240 likes.

My journey into software began at [Works Applications](https://www.worksap.sg/), where I started as a **Graduate Software Engineer**. Before that, I spent a year as a **Research Officer** after earning my Bachelor of Engineering (Product Development) from [SUTD](https://www.sutd.edu.sg/). My research on impulse shaping to suppress oscillations in spherical rolling robots was [published](https://ieeexplore.ieee.org/document/8014259) at the IEEE Advanced Intelligent Mechatronics (AIM) Conference in 2017.

Outside of work, I enjoy **cycling**, **practicing yoga**, and **going to the gym**. The [longest ride](https://www.strava.com/activities/11811566357) I've completed was a 120km loop around Singapore. My most challenging ride to date was a triple climb of [Page Mill Rd, Pescadero, and Tunitas Creek](https://www.strava.com/activities/12183241879) in the Bay Area. I also enjoy playing the **piano** casually. During the COVID-19 lockdowns, I challenged myself to record **30 covers in 30 days**, which I compiled into a [playlist on SoundCloud](https://soundcloud.com/stevanus-satria/sets/piano-covers).

Whether I'm cycling, playing piano, or building software, I love tackling challenges, learning new things, and creating experiences that matter. Want to learn more or have a conversation about products, tech, or hobbies? Get <ContactChatLink message="I'd like to get in touch with Steve!">Advocado</ContactChatLink> to help you drop me a note!
