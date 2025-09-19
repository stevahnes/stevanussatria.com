---
outline: false
title: "Stevanus Satria Resume - Senior Product Manager at Workato"
description: "Download Stevanus Satria's professional resume. Senior Product Manager at Workato with 7+ years of experience in B2B SaaS, product management, and software engineering. Former roles at Shopee and Amadeus."
keywords: "Stevanus Satria resume, product manager resume, Workato, Shopee, Amadeus, software engineer, B2B SaaS, Singapore, Kellogg, SUTD"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Stevanus Satria Resume - Senior Product Manager at Workato"
  - - meta
    - property: og:description
      content: "Download Stevanus Satria's professional resume. Senior Product Manager at Workato with 7+ years of experience in B2B SaaS, product management, and software engineering."
  - - meta
    - property: og:type
      content: profile
  - - meta
    - property: og:url
      content: https://stevanussatria.com/resume
  - - link
    - rel: canonical
      href: https://stevanussatria.com/resume
---

<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted, nextTick } from 'vue'

const isClient = ref(false)
const downloadButtonRef = ref(null)

onMounted(async () => {
  isClient.value = true

  // Check if we should auto-trigger download (from navigation)
  const urlParams = new URLSearchParams(window.location.search)
  const autoDownload = urlParams.get('auto') === 'true'
  
  if (autoDownload) {
    // Wait for the component to be fully mounted
    await nextTick()
    
    // Try multiple approaches with increasing delays
    const attemptDownload = (attempt = 1) => {      
      // Method 1: Try DOM query
      const downloadBtn = document.querySelector('button[data-download-resume]')
      if (downloadBtn) {
        downloadBtn.click()
        return
      }
      
      // Method 2: Retry if component hasn't loaded yet (max 5 attempts)
      if (attempt < 5) {
        setTimeout(() => attemptDownload(attempt + 1), 300 * attempt)
      } else {
        console.warn('Could not trigger auto-download - component not ready')
      }
    }
    
    // Start the first attempt after a small delay
    setTimeout(() => attemptDownload(), 200)
  }
})

const DownloadResumeButton = defineAsyncComponent({
  loader: () => import('./components/DownloadResume.vue'),
  loadingComponent: {
    template: `<button class="!border-none !py-2.5 !px-6 !text-center !no-underline !inline-block !text-base !m-1 !cursor-wait !rounded-full !font-medium !transition-all !duration-300 !shadow-sm !font-sans !tracking-wide !bg-gray-400 !text-white">Loading...</button>`
  },
  delay: 0,
  timeout: 10000
})
</script>

<div style="text-align: right; margin-bottom: 20px;">
  <ClientOnly>
    <DownloadResumeButton ref="downloadComponentRef" filename="Stevanus SATRIA.pdf" />
  </ClientOnly>
</div>

# STEVANUS SATRIA

[LinkedIn](https://www.linkedin.com/in/stevanussatria) | [stevanus.satria@gmail.com](mailto:stevanus.satria@gmail.com) | (65) 8366 8579 | [www.stevanussatria.com](https://www.stevanussatria.com)

## Personal Profile

Product leader with 7+ years driving growth and innovation in B2B SaaS and consumer products across orchestration, e-commerce, and aviation industries. Proven track record in launching revenue-generating features, modernizing legacy systems, and leading large-scale customer migrations. Skilled in balancing usability, performance, and security while guiding cross-functional teams from vision to execution. Certified Scrum Product Owner, ScrumMaster, and Usability Analyst, with hands-on experience building AI-powered products, architecting scalable systems, and integrating APIs to drive customer impact. Fluent in English, Indonesian, and Malay, with conversational Chinese.

## Core Competencies

SQL • Python • AngularJS • JavaScript • Typescript • Java • HTML • CSS • Git • JIRA • Confluence • ScriptRunner • Figma
API • Postman • Agile • Scrum • Product specification • Design thinking • Project management • Process automation

## Work Experience

### Workato

**Senior Product Manager** | Singapore | March 2025 – Present  
**Product Manager** | Singapore | June 2022 – March 2025

- Led Workato Data Tables general availability launch as Lookup Tables' successor for all Workato users.
- Released native XSLT and XSD support adopted by enterprise customers contributing to over US$1 million in ARR.
- Stabilized legacy database by reducing maximum query execution time by 96% and freeing up 277GB of storage space.
- Spearheaded migration of 90% of customers using code connectors to sandboxed execution.
- Led verification effort of Workato solutions for SuccessFactors and Google Cloud integrations with SAP and Google.

### Shopee

**Senior Associate, Product Management** | Singapore | March 2021 – June 2022

- Enhanced chat safety by releasing QR code detection feature and monitoring dashboard, achieving >90% detection rate.
- Spearheaded the integration of anti-fraud system to protect Shopee Chat's internal API from fraudulent and spam usage.
- Launched an internal quality control portal for internal audit of messages sent within Shopee Chat.
- Reduced page load time of Shopee's App Chat by 50% and removed loading state while scrolling across all platforms.

### Amadeus IT Group

**System Analyst (Software Engineer)** | Singapore | April 2020 – March 2021  
**Amadeus IT Graduate (Technical Business Analyst)** | Singapore | July 2018 – March 2020

- Developed key features for three modules within our SaaS-based Airport Management Suite using frameworks.
- Launched cross-functional biometric initiative pilot in 2019 with Ljubljana Airport, attaining a 75% success rate.
- Redesigned our SaaS-based airport map UI following the industry standard to support up to 5x more data on the viewport.

### Works Applications Co., Ltd.

**Software Engineer** | Singapore | October 2017 – June 2018

- Implemented new features of a mobile application for human resource management in plain JavaScript.
- Designed various ways to improve application usability and reduce user input using InVision.

### Singapore University of Technology and Design (SUTD)

**Research Officer** | Singapore | October 2016 – Sep 2017

- Published an IEEE paper on novel open-loop algorithm to control the locomotion and behavior of spherical rolling robots.
- Implemented and fine-tuned a new dead-reckoning localization algorithm for VIRGO, a miniaturized spherical rolling robot developed for defense-related applications.
- Incorporated a wireless First Person View (FPV) camera onto VIRGO without increasing its overall 60mm footprint.

## Education

### Kellogg School of Management (Northwestern University)

**Product Strategy Executive Education** | March 2024 – May 2024

### Singapore University of Technology and Design (SUTD)

**Bachelor of Engineering (Product Development)** | May 2013 – September 2016

Summa Cum Laude, CGPA: 4.96/5.00

### Catholic Junior College

**GCE A-Level** | January 2011 – December 2012

University Admission Score (UAS): 90/90, H3: Physics (Merit)

## Awards and Certifications

- Value Star Award - "We Serve" (Marketplace Product Manager) | May 2022
- IES Gold Medal (Top Cohort Graduate) & Keppel Award of Excellence (Senior & Junior Years) | September 2016
- ASEAN Undergraduate Scholarship & Tay Chen Hui Memorial Award (Top Science Student) | July 2013
