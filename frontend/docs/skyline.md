---
layout: home
title: "Skyline"
description: "Explore Stevanus Satria's travel history and flight routes around the world, visualized on an interactive map."
keywords: "Stevanus Satria, flight history, travel map, interactive visualization, flight routes"
author: "Stevanus Satria"
head:
  - - meta
    - property: og:title
      content: "Skyline"
  - - meta
    - property: og:description
      content: "Explore Stevanus Satria's travel history and flight routes around the world, visualized on an interactive map."
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:url
      content: https://stevanussatria.com/skyline
  - - meta
    - name: twitter:title
      content: "Skyline"
  - - meta
    - name: twitter:description
      content: "Explore Stevanus Satria's travel history and flight routes around the world, visualized on an interactive map."
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - link
    - rel: canonical
      href: https://stevanussatria.com/skyline
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const FlightMap = defineAsyncComponent(() => 
  import('./components/FlightMap.vue')
)

// Optimized flight data with compressed structure and type safety
interface FlightRecord {
  date: string;
  time: string;
  origin: string;
  destination: string;
  flightNumber: string;
  departureDateTime: string;
  arrivalDateTime: string;
  airline: string;
  aircraft?: string | null;
  class?: string | null;
  seat?: string | null;
}

// Helper function to create flight record from array
const createFlight = ([date, time, origin, destination, flightNumber, airline, aircraft = null, flightClass = null, seat = null]: readonly [string, string, string, string, string, string, string?, string?, string?]): FlightRecord => ({
  date,
  time,
  origin,
  destination,
  flightNumber,
  departureDateTime: `${date}T${time}`,
  arrivalDateTime: `${date}T${time}`,
  airline,
  aircraft: aircraft === "" ? null : aircraft,
  class: flightClass === "" ? null : (flightClass || null),
  seat: seat === "" ? null : (seat || null)
});

// All flight data using consistent array approach
const flightData: FlightRecord[] = [
  // 2014 flights
  ["2014-06-07", "17:40:00", "SIN", "DXB", "EK405", "EK", "77W"],
  ["2014-06-07", "05:15:00", "DXB", "BOS", "EK237", "EK", "77L"],
  ["2014-07-03", "22:45:00", "BOS", "ATL", "DL1201", "DL", "738"],
  ["2014-07-04", "02:50:00", "ATL", "TPA", "DL2277", "DL", "739"],
  ["2014-07-06", "14:15:00", "TPA", "BOS", "B6192", "B6", "320"],
  ["2014-08-16", "03:15:00", "BOS", "DXB", "EK238", "EK", "77W"],
  ["2014-08-16", "22:45:00", "DXB", "SIN", "EK432", "EK", "77W"],
  ["2014-08-24", "02:15:00", "SIN", "HKG", "3K697", "3K", "320"],
  ["2014-08-29", "06:55:00", "HKG", "SIN", "3K698", "3K", "320"],

  // 2015 flights
  ["2015-06-07", "15:15:00", "SIN", "IST", "TK55", "TK", "330"],
  ["2015-06-08", "06:30:00", "IST", "GRU", "TK15", "TK", "77W"],
  ["2015-09-10", "06:05:00", "GRU", "IST", "TK16", "TK", "77W"],
  ["2015-09-10", "22:20:00", "IST", "SIN", "TK54", "TK", "330"],
  ["2015-10-12", "13:45:00", "SIN", "DXB", "EK355", "EK", "388"],
  ["2015-10-12", "23:20:00", "DXB", "FCO", "EK99", "EK", "773"],
  ["2015-10-18", "13:25:00", "FCO", "DXB", "EK98", "EK", "388"],
  ["2015-10-18", "23:05:00", "DXB", "SIN", "EK354", "EK", "388"],
  ["2015-12-20", "23:45:00", "SIN", "CGK", "3K201", "3K"],

  // 2016 flights
  ["2016-02-05", "09:45:00", "SIN", "CGK", "GA835", "GA", "738"],
  ["2016-02-10", "04:15:00", "CGK", "SIN", "JT*154", "JT*", "739"],

  // 2017 flights
  ["2017-01-08", "13:00:00", "CGK", "SIN", "TR2273", "TR", "320"],
  ["2017-07-02", "13:40:00", "SIN", "DXB", "EK355", "EK", null, "Economy"],
  ["2017-07-03", "00:00:00", "DXB", "MUC", "EK53", "EK", "77W", "Economy"],
  ["2017-07-16", "06:30:00", "TXL", "MUC", "AB6185", "AB"],
  ["2017-07-16", "13:40:00", "MUC", "DXB", "EK50", "EK", "388", "Economy", "81H"],
  ["2017-07-16", "23:05:00", "DXB", "SIN", "EK354", "EK", "388", "Economy", "47C"],
  ["2017-09-23", "00:10:00", "SIN", "CGK", "TR2274", "TR"],
  ["2017-10-01", "06:50:00", "CGK", "SIN", "QZ266", "QZ"],
  ["2017-12-29", "23:30:00", "SIN", "KNO", "SQ5234", "SQ", "738", "Economy (K)", "16D"],

  // 2018 flights
  ["2018-01-03", "09:25:00", "KNO", "SIN", "3K284", "3K", "320"],
  ["2018-02-16", "01:50:00", "SIN", "CGK", "TR276", "TR", "320", "Economy(M1)"],
  ["2018-02-19", "07:25:00", "CGK", "SIN", "QZ266", "QZ", "32S", "Economy(V)"],
  ["2018-05-19", "00:15:00", "SIN", "CGK", "3K201", "3K"],
  ["2018-05-20", "08:10:00", "CGK", "SIN", "3K204", "3K"],
  ["2018-05-27", "09:15:00", "CGK", "SIN", "JT*156", "JT*", "739"],
  ["2018-08-05", "11:25:00", "SIN", "BLR", "9W23", "9W", "738"],
  ["2018-08-10", "20:00:00", "BLR", "SIN", "9W26", "9W", "738"],
  ["2018-08-22", "00:15:00", "SIN", "CGK", "3K201", "3K", "32S"],
  ["2018-08-23", "22:25:00", "CGK", "SIN", "SQ951", "SQ", "773"],
  ["2018-08-24", "01:25:00", "SIN", "SFO", "SQ32", "SQ", "359"],
  ["2018-08-30", "18:10:00", "SFO", "LAX", "DL2727", "DL", "738", "Basic Economy (E)", "30A"],
  ["2018-09-06", "00:50:00", "LAX", "ICN", "SQ7", "SQ", "77W"],
  ["2018-09-06", "15:35:00", "ICN", "SIN", "SQ7", "SQ"],
  ["2018-09-06", "23:40:00", "SIN", "CGK", "SQ952", "SQ", "773"],
  ["2018-09-09", "09:15:00", "CGK", "SIN", "JT*156", "JT*", "739"],
  ["2018-11-09", "23:45:00", "SIN", "CGK", "3K201", "3K", "32S"],
  ["2018-11-11", "14:55:00", "CGK", "SIN", "3K206", "3K", "32S"],
  ["2018-12-01", "10:00:00", "SIN", "HKG", "CX716", "CX", "351"],
  ["2018-12-04", "12:00:00", "HKG", "SIN", "CX715", "CX", "773"],

  // 2019 flights
  ["2019-01-06", "10:15:00", "SIN", "BKK", "TG408", "TG", "772", "Coach Class"],
  ["2019-01-06", "14:35:00", "BKK", "BLR", "TG325", "TG", "772", "Coach Class"],
  ["2019-01-18", "19:30:00", "BLR", "BKK", "TG326", "TG", "772", "Coach Class"],
  ["2019-01-19", "01:00:00", "BKK", "SIN", "TG403", "TG", "359", "Coach Class"],
  ["2019-02-02", "01:50:00", "SIN", "CGK", "TR276", "TR", "319"],
  ["2019-02-10", "13:00:00", "CGK", "SIN", "TR279", "TR", "319"],
  ["2019-03-10", "10:15:00", "SIN", "BKK", "TG408", "TG", "772", "Coach Class"],
  ["2019-03-10", "14:35:00", "BKK", "BLR", "TG325", "TG", "772", "Coach Class"],
  ["2019-03-29", "19:30:00", "BLR", "BKK", "TG326", "TG", "772", "Coach Class"],
  ["2019-03-30", "01:00:00", "BKK", "SIN", "TG403", "TG", "359", "Coach Class"],
  ["2019-05-07", "04:50:00", "SIN", "BKK", "SQ974", "SQ", "333", "Coach Class", "51F"],
  ["2019-05-10", "14:10:00", "BKK", "SIN", "SQ981", "SQ", "781", "Coach Class", "65B"],
  ["2019-06-01", "01:10:00", "SIN", "PEN", "TR426", "TR", "320"],
  ["2019-06-04", "03:10:00", "PEN", "SIN", "TR427", "TR", "320"],
  ["2019-06-05", "02:20:00", "SIN", "CGK", "TR276", "TR"],
  ["2019-06-09", "14:35:00", "CGK", "SIN", "3K206", "3K", "32A", "Economy"],
  ["2019-06-10", "15:25:00", "SIN", "IST", "TK55", "TK", "738", "Coach Class"],
  ["2019-06-11", "05:30:00", "IST", "NCE", "TK1813", "TK", "321", "Coach Class"],
  ["2019-07-05", "16:20:00", "NCE", "IST", "TK1816", "TK", "321", "Coach Class"],
  ["2019-07-05", "23:00:00", "IST", "SIN", "TK54", "TK", "738", "Coach Class"],
  ["2019-08-04", "15:25:00", "SIN", "IST", "TK55", "TK", "738", "Coach Class"],
  ["2019-08-05", "05:25:00", "IST", "NCE", "TK1813", "TK", "32B", "Coach Class"],
  ["2019-08-15", "04:10:00", "NCE", "CDG", "U23990", "U2"],
  ["2019-08-18", "13:05:00", "CDG", "NCE", "U23995", "U2"],
  ["2019-08-30", "16:20:00", "NCE", "IST", "TK1816", "TK", "321", "Coach Class"],
  ["2019-08-30", "23:00:00", "IST", "SIN", "TK54", "TK", "77W", "Coach Class"],
  ["2019-10-06", "15:40:00", "SIN", "FRA", "LH779", "LH", "388", "Economy", "63D"],
  ["2019-10-07", "06:15:00", "FRA", "NCE", "LH1058", "LH", "32A", "Economy", "7C"],
  ["2019-11-01", "18:05:00", "NCE", "FRA", "LH1065", "LH", "32A", "ECO CLASSIC", "14C"],
  ["2019-11-13", "08:10:00", "CDG", "MUC", "LH2227", "LH", "32A", "Coach Class"],
  ["2019-11-13", "11:20:00", "MUC", "SIN", "SQ327", "SQ", "359", "Coach Class"],
  ["2019-11-14", "01:30:00", "SIN", "CGK", "SQ956", "SQ", "359"],
  ["2019-12-24", "07:00:00", "SIN", "CGK", "3K203", "3K", "320"],

  // 2020 flights
  ["2020-01-01", "14:55:00", "CGK", "SIN", "3K206", "3K", "320"],
  ["2020-01-24", "23:45:00", "SIN", "CGK", "3K201", "3K", "320"],
  ["2020-02-02", "13:45:00", "CGK", "SIN", "3K212", "3K", "32A"],
  ["2020-03-04", "23:30:00", "SIN", "KNO", "SQ5234", "SQ", "73H"],
  ["2020-03-09", "09:25:00", "KNO", "SIN", "3K284", "3K", "32A"],
  
  // 2022 flights
  ["2022-05-13", "23:50:00", "SIN", "CGK", "3K201", "3K", "320"],
  ["2022-06-12", "12:55:00", "CGK", "SIN", "TR279", "TR", "320"],
  ["2022-09-10", "04:15:00", "CGK", "SIN", "SQ957", "SQ", "359"],
  ["2022-10-02", "04:30:00", "SIN", "CGK", "SQ958", "SQ", "359"],
  ["2022-12-03", "12:05:00", "SIN", "BLR", "SQ510", "SQ", "359"],
  ["2022-12-11", "06:25:00", "BLR", "SIN", "SQ509", "SQ", "7M8", "Economy"],
  ["2022-12-19", "04:15:00", "CGK", "SIN", "SQ957", "SQ", "359"],
  
  // 2023 flights
  ["2023-01-15", "04:30:00", "SIN", "CGK", "SQ958", "SQ", "359"],
  ["2023-01-19", "02:25:00", "SIN", "CGK", "QZ263", "QZ", "320"],
  ["2023-02-05", "11:20:00", "CGK", "SIN", "QZ268", "QZ", "320"],
  ["2023-04-15", "02:20:00", "SIN", "CGK", "TR276", "TR", "320"],
  ["2023-05-07", "12:55:00", "CGK", "SIN", "TR279", "TR", "320"],
  ["2023-07-03", "01:55:00", "SIN", "CGK", "QG523", "QG"],
  ["2023-07-29", "09:20:00", "CGK", "SIN", "QG526", "QG"],
  ["2023-08-12", "01:45:00", "SIN", "HKG", "CX658", "CX", "359", null, "63H"],
  ["2023-08-20", "12:45:00", "HKG", "SIN", "CX715", "CX", "359"],
  ["2023-08-31", "12:00:00", "SIN", "CGK", "QG527", "QG"],
  ["2023-09-05", "09:20:00", "CGK", "SIN", "QG526", "QG"],
  ["2023-10-01", "03:15:00", "SIN", "IST", "TK209", "TK", "359"],
  ["2023-10-09", "14:15:00", "IST", "SIN", "TK208", "TK", "359"],
  ["2023-11-18", "12:00:00", "SIN", "CGK", "QG527", "QG"],
  ["2023-11-20", "11:00:00", "CGK", "SIN", "SQ963", "SQ", "359"],
  ["2023-11-20", "15:45:00", "SIN", "MXP", "SQ356", "SQ", "359"],
  ["2023-12-07", "09:25:00", "AMS", "SIN", "SQ323", "SQ", "359"],
  ["2023-12-07", "22:50:00", "SIN", "CGK", "SQ950", "SQ", "77W", "Economy"],
  
  // 2024 flights
  ["2024-02-05", "11:30:00", "SIN", "CGK", "GA837", "GA", "339"],
  ["2024-02-13", "11:40:00", "CGK", "SIN", "GA822", "GA", "73H"],
  ["2024-02-17", "14:20:00", "SIN", "GUM", "UA28", "UA", "789"],
  ["2024-02-17", "10:00:00", "GUM", "HNL", "UA28", "UA", "789"],
  ["2024-02-17", "20:00:00", "HNL", "SFO", "UA214", "UA", "75T", null, "36C"],
  ["2024-02-23", "18:40:00", "SFO", "SIN", "UA29", "UA", "789"],
  ["2024-04-07", "04:20:00", "SIN", "CGK", "GA829", "GA", "77W"],
  ["2024-04-28", "08:40:00", "CGK", "SIN", "GA836", "GA", "333"],
  ["2024-06-13", "00:40:00", "SIN", "MAA", "SQ524", "SQ", "359", "Economy"],
  ["2024-06-16", "06:00:00", "MAA", "SIN", "SQ525", "SQ", "7M8", "Economy"],
  ["2024-08-04", "23:50:00", "SIN", "CGK", "3K201", "3K", "320"],
  ["2024-08-10", "08:25:00", "CGK", "SIN", "3K204", "3K", "320"],
  ["2024-08-11", "11:50:00", "SIN", "SFO", "SQ34", "SQ", "359", "Economy"],
  ["2024-08-26", "05:05:00", "SFO", "SIN", "SQ33", "SQ", "359", "Economy"],
  ["2024-09-18", "06:00:00", "SIN", "KNO", "ID*7146", "ID*", "32A"],
  ["2024-09-21", "13:05:00", "KNO", "SIN", "SQ995", "SQ", "7M8", "Economy"],
  ["2024-09-24", "00:00:00", "SIN", "HKG", "CX710", "CX"],
  ["2024-09-29", "08:40:00", "HKG", "SIN", "CX711", "CX"],
  ["2024-12-23", "08:55:00", "SIN", "TPE", "TR874", "TR"],
  ["2024-12-29", "01:30:00", "TPE", "SIN", "TR897", "TR"],
  
  // 2025 flights
  ["2025-01-26", "14:40:00", "SIN", "CGK", "3K203", "3K", "Airbus A320", "Starter Plus", "7C"],
  ["2025-02-09", "16:15:00", "CGK", "SIN", "3K204", "3K", "Airbus A320", "Starter Plus"],
  ["2025-03-19", "22:20:00", "SIN", "NRT", "NH844", "NH", "789", "Economy Class : V", "22J,22K"],
  ["2025-04-03", "11:55:00", "TOY", "NRT", "NH316", "NH", "738", "Economy Class", "15K,15J"],
  ["2025-04-08", "12:40:00", "NRT", "SIN", "NH843", "NH", "789", "Economy Class : S", "22J,22K"],
  ["2025-04-26", "10:10:00", "SIN", "CGK", "QG523", "QG"],
  ["2025-05-04", "17:10:00", "CGK", "SIN", "QG526", "QG"],
  ["2025-06-26", "07:40:00", "SIN", "CGK", "SQ952", "SQ"],
  ["2025-06-30", "20:15:00", "CGK", "SIN", "SQ967", "SQ"],
  ["2025-08-20", "21:30:00", "SIN", "MAA", "TR578", "TR"],
  ["2025-08-23", "00:05:00", "MAA", "SIN", "TR579", "TR"],
  ["2025-09-06", "10:55:00", "SIN", "FRA", "SQ326", "SQ"],
  ["2025-09-06", "19:40:00", "FRA", "SOF", "LH1430", "LH"],
  ["2025-09-12", "18:35:00", "SOF", "FRA", "LH1429", "LH"],
  ["2025-09-12", "21:40:00", "FRA", "SIN", "SQ325", "SQ"],
  ["2025-10-30", "11:25:00", "SIN", "HKG", "TR938", "TR"],
  ["2025-11-05", "17:55:00", "HKG", "SIN", "TR939", "TR"],
].map(createFlight);
</script>

<FlightMap :flights="flightData" height="80vh" />
