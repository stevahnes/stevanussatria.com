---
outline: false
prev: false
next: false
title: "Stevanus Satria | Milestones"
description: "Key achievements and milestones in Stevanus Satria's professional journey, from academic excellence to career advancement and community contributions."
keywords: "Stevanus Satria, career milestones, achievements, awards, certifications, professional journey"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Stevanus Satria | Milestones"
  - - meta
    - property: og:description
      content: "Key achievements and milestones in Stevanus Satria's professional journey, from academic excellence to career advancement and community contributions."
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:url
      content: https://stevanussatria.com/milestones
  - - meta
    - name: twitter:title
      content: "Stevanus Satria | Milestones"
  - - meta
    - name: twitter:description
      content: "Key achievements and milestones in Stevanus Satria's professional journey, from academic excellence to career advancement and community contributions."
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - link
    - rel: canonical
      href: https://stevanussatria.com/milestones
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const Timeline = defineAsyncComponent(() => 
  import('./components/Timeline.vue')
)

// Optimized milestone data with compressed structure and type safety
interface MilestoneRecord {
  time: string;
  title: string;
  description: string;
  path?: string | null;
  cta?: string | null;
  anchor?: string | null;
}

// Helper function to create milestone record from array
const createMilestone = ([time, title, description, path = null, cta = null, anchor = null]: readonly [string, string, string, string?, string?, string?]): MilestoneRecord => ({
  time,
  title,
  description,
  path: path || null,
  cta: cta || null,
  anchor: anchor || null
});

// All milestone data using consistent array approach
const milestoneData: MilestoneRecord[] = [
  // 2025 milestones
  ["Oct 2025", "Completed Professional Certificate in Strategic Management", "Obtained from Wharton School of the University of Pennsylvania.", "https://credentials.edx.org/credentials/c2a6ddb085a24150bac2d81b37bc3616/", "Verify", "2025"],
  ["Mar 2025", "Promoted to Senior Product Manager", "Finally made my first career big splash.", null, null, "2025"],
  ["Mar 2025", "Got married", "Mrs said yes to a lifetime together. Strictly no take backsies!"],

  // 2024 milestones
  ["May 2024", "Completed Executive Education in Product Strategy", "Obtained from the Northwestern University Kellogg School of Management.", "https://execedcertificate.kellogg.northwestern.edu/e767d718-50bc-4034-bcca-7be97a9b53ba", "Verify", "2024"],

  // 2022 milestones
  ["Sep 2022", "Second ADPList Super Mentor award", "I guess people find my thoughts and opinion rather insightful.", null, null, "2022"],
  ["Jun 2022", "Completed Workato's Automation Pro III", "Became an expert in my own product, as it should be.", "https://verify.skilljar.com/c/aedm5bnsixju", "Verify"],
  ["Mar 2022", "First ADPList Super Mentor award", "Gained recognition for spending a lot of time talking."],

  // 2021 milestones
  ["Dec 2021", "Joined ADPList as a mentor", "Helped aspiring product managers/techies get their first gig in the biz.", null, null, "2021"],
  ["Mar 2021", "Became a Certified Usability Analyst", "HFI taught me the basics of good human-computer interaction.", "https://www.credly.com/badges/b924a4ba-3f7a-42d6-92e0-ac2c87f55a5e/", "Verify"],
  ["Jan 2021", "Became an Advanced Certified Scrum Product Owner", "Basically, I got Scrum ingrained in my brain even more.", "https://bcert.me/sxeivdiqf", "Verify"],

  // 2020 milestones
  ["Apr 2020", "Published 4 Figma Plugins", "One of which runs a basic Snake game in Figma.", null, null, "2020"],

  // 2017 milestones
  ["Jul 2017", "Presented at IEEE AIM Conference", "Flew to Germany to speak about impulse shaper and drink weißbier.", "https://ieeexplore.ieee.org/document/8014259/", "View publication", "2017"],
  ["Jun 2017", "Conducted a robot design workshop", "Got people to assemble my pseudo-Lego kit at the Art Science Museum."],

  // 2016 milestones
  ["Sep 2016", "Received the IES Gold Medal award", "Somehow graduated top of my batch again, this time in university.", null, null, "2016"],
  ["Mar 2016", "Became a Certified SOLIDWORKS Professional", "Passed the more rigorous exam measuring my CAD proficiency.", "https://cv.virtualtester.com/qr/?b=SLDWRKS&i=C-REF3DRFNDN", "Verify"],

  // 2015 milestones
  ["Oct 2015", "Exhibited at Maker Faire European Edition 2015", "Flew to Italy to showcase our amphibious rolling robot.", null, null, "2015"],

  // 2014 milestones
  ["Jun 2014", "Received the Di Yerbury International Scholar award", "Plus pocket money to spend during my exchange at MIT.", null, null, "2014"],

  // 2013 milestones
  ["Jul 2013", "Received the Tay Chen Hui Memorial award", "Somehow graduated as top science student from my high school.", null, null, "2013"],
  ["May 2013", "Received the ASEAN Undergraduate Scholarship", "Secured free tertiary education."],

  // 2008 milestones
  ["Nov 2008", "Received the MOE School-Based Scholarship", "And migrated to Singapore in search of a better future.", null, null, "2008"],
].map(createMilestone);
</script>

<Timeline :items="milestoneData" />
