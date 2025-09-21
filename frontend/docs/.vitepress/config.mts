import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Stevanus Satria",
  description:
    "Stevanus Satria is a Senior Product Manager at Workato with 7+ years of experience in B2B SaaS, frontend development, and product management. Explore his projects, experience, and professional journey.",
  lang: "en-US",
  head: [
    // Favicon
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/small-logo-white-circle-bg.webp",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/small-logo-white-circle-bg.webp",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/small-logo-white-circle-bg.webp",
      },
    ],
    [
      "link",
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],

    // SEO Meta Tags
    ["meta", { name: "author", content: "Stevanus Satria" }],
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { name: "googlebot", content: "index, follow" }],
    ["meta", { name: "theme-color", content: "#3b82f6" }],
    ["meta", { name: "msapplication-TileColor", content: "#3b82f6" }],

    // Open Graph / Facebook
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Stevanus Satria" }],
    ["meta", { property: "og:title", content: "Stevanus Satria" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Senior Product Manager at Workato with 7+ years of experience in B2B SaaS, frontend development, and product management.",
      },
    ],
    ["meta", { property: "og:image", content: "https://stevanussatria.com/me.webp" }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:image:alt", content: "Stevanus Satria - Product Manager" }],
    ["meta", { property: "og:url", content: "https://stevanussatria.com" }],
    ["meta", { property: "og:locale", content: "en_US" }],

    // Twitter Card
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@stevanussatria" }],
    ["meta", { name: "twitter:creator", content: "@stevanussatria" }],
    ["meta", { name: "twitter:title", content: "Stevanus Satria" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Senior Product Manager at Workato with 7+ years of experience in B2B SaaS, frontend development, and product management.",
      },
    ],
    ["meta", { name: "twitter:image", content: "https://stevanussatria.com/me.webp" }],
    ["meta", { name: "twitter:image:alt", content: "Stevanus Satria - Product Manager" }],

    // Additional SEO
    [
      "meta",
      {
        name: "keywords",
        content:
          "product manager, software engineer, frontend developer, B2B SaaS, Workato, Shopee, Amadeus, VitePress, Vue.js, TypeScript, Singapore",
      },
    ],
    ["meta", { name: "viewport", content: "width=device-width, initial-scale=1" }],
    ["meta", { name: "format-detection", content: "telephone=no" }],

    // Canonical URL
    ["link", { rel: "canonical", href: "https://stevanussatria.com" }],

    // DNS prefetch for external resources
    ["link", { rel: "dns-prefetch", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "dns-prefetch", href: "https://fonts.gstatic.com" }],
    ["link", { rel: "dns-prefetch", href: "https://api.github.com" }],

    // Preconnect to external domains
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { rel: "preconnect", href: "https://www.google-analytics.com" }],
    ["link", { rel: "preconnect", href: "https://www.googletagmanager.com" }],
    ["link", { rel: "preconnect", href: "https://giscus.app" }],

    // Structured Data
    [
      "script",
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Stevanus Satria",
          jobTitle: "Senior Product Manager",
          worksFor: {
            "@type": "Organization",
            name: "Workato",
          },
          description:
            "Senior Product Manager with 7+ years of experience in B2B SaaS, frontend development, and product management",
          url: "https://stevanussatria.com",
          image: "https://stevanussatria.com/me.webp",
          sameAs: [
            "https://www.linkedin.com/in/stevanussatria",
            "https://github.com/stevahnes",
            "https://www.researchgate.net/profile/Stevanus-Satria",
            "https://www.strava.com/athletes/18347400",
            "https://soundcloud.com/stevanus-satria",
          ],
          knowsAbout: [
            "Product Management",
            "B2B SaaS",
            "Frontend Development",
            "Vue.js",
            "TypeScript",
            "Angular",
            "Software Engineering",
          ],
        }),
      },
    ],
    // Google Analytics (if you have it)
    // ["script", { async: true, src: "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID" }],
    // ["script", { innerHTML: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'GA_MEASUREMENT_ID');" }],
  ],
  themeConfig: {
    logo: "/small-logo-no-bg.webp",
    nav: [
      { text: "Home", link: "/" },
      { text: "About", link: "/about" },
      { text: "Resume", link: "/resume" },
      { text: "Projects", link: "/projects" },
      { text: "Milestones", link: "/milestones" },
      { text: "Recommendations", link: "/recommendations" },
      { text: "AMA", link: "/ama" },
      { text: "Stack", link: "/stack" },
      { text: "Gear", link: "/gear" },
      { text: "Skyline", link: "/skyline" },
    ],

    sidebar: {
      "/projects/": [
        {
          text: "Advocado",
          link: "https://github.com/stevahnes/vitepress-portfolio/tree/main/langbase",
          target: "_blank",
        },
        {
          text: "Portfolio (VitePress)",
          link: "https://github.com/stevahnes/vitepress-portfolio",
          target: "_blank",
        },
        {
          text: "Call Home",
          link: "https://github.com/bettersg/call-home",
          target: "_blank",
        },
        {
          text: "Portfolio (WordPress)",
          link: "/projects/portfolio-wordpress",
        },
        {
          text: "Figma Plugins",
          link: "https://www.figma.com/@stevahnes",
          target: "_blank",
        },
        {
          text: "BRÜ-ME",
          link: "https://youtu.be/ch4kpChdSHs",
          target: "_blank",
        },
        {
          text: "Lumos",
          link: "https://youtu.be/qXR_C5dezqM",
          target: "_blank",
        },
        {
          text: "RoverBot",
          link: "https://youtu.be/VbQ1-GKdCEk",
          target: "_blank",
        },
        {
          text: "ZOUBA",
          link: "https://youtu.be/oQVsBJ_NuM8",
          target: "_blank",
        },
        {
          text: "Mod-Bot",
          link: "https://youtu.be/DdzkIislYo0",
          target: "_blank",
        },
        {
          text: "SALAMANDER",
          link: "https://youtu.be/3CECXdaeLnI",
          target: "_blank",
        },
        {
          text: "Velox",
          link: "https://youtu.be/IPcm3R25azw",
          target: "_blank",
        },
        {
          text: "Troll Kart",
          link: "https://youtu.be/lIg7apmuWjo",
          target: "_blank",
        },
        {
          text: "Quadwalker",
          link: "https://youtu.be/xLcHc-iailM",
          target: "_blank",
        },
      ],
      "/milestones": [
        {
          text: "2025",
          link: "/milestones#2025",
        },
        {
          text: "2024",
          link: "/milestones#2024",
        },
        {
          text: "2022",
          link: "/milestones#2022",
        },
        {
          text: "2021",
          link: "/milestones#2021",
        },
        {
          text: "2020",
          link: "/milestones#2020",
        },
        {
          text: "2017",
          link: "/milestones#2017",
        },
        {
          text: "2016",
          link: "/milestones#2016",
        },
        {
          text: "2015",
          link: "/milestones#2015",
        },
        {
          text: "2014",
          link: "/milestones#2014",
        },
        {
          text: "2013",
          link: "/milestones#2013",
        },
        {
          text: "2008",
          link: "/milestones#2008",
        },
      ],
      "/recommendations": [
        {
          text: "Workato",
          link: "/recommendations#workato",
          items: [
            {
              text: "Vishakan Subramanian",
              link: "/recommendations#vishakan-subramanian",
            },
            { text: "Chisin Ng", link: "/recommendations#chisin-ng" },
            {
              text: "Swathi Asokraj",
              link: "/recommendations#swathi-asokraj",
            },
          ],
        },
        {
          text: "ADPList",
          link: "/recommendations#adplist",
          items: [
            {
              text: "Alyssa De Conceicao",
              link: "/recommendations#alyssa-de-conceicao",
            },
            {
              text: "Rahul M Jacob",
              link: "/recommendations#rahul-m-jacob",
            },
            {
              text: "Karen Kaycia",
              link: "/recommendations#karen-kaycia",
            },
            {
              text: "Sharon Siah",
              link: "/recommendations#sharon-siah",
            },
            {
              text: "Jean Ong",
              link: "/recommendations#jean-ong",
            },
            {
              text: "Tulika Khabia",
              link: "/recommendations#tulika-khabia",
            },
            {
              text: "Maxwell Kabona",
              link: "/recommendations#maxwell-kabona",
            },
            {
              text: "Zioedy Wong",
              link: "/recommendations#zioedy-wong",
            },
            {
              text: "Yao Yao",
              link: "/recommendations#yao-yao",
            },
            {
              text: "Shahroze Husain",
              link: "/recommendations#shahroze-husain",
            },
            {
              text: "Clement Perdana",
              link: "/recommendations#clement-perdana",
            },
            {
              text: "Kevin Govinda",
              link: "/recommendations#kevin-govinda",
            },
            {
              text: "Yashi Huang",
              link: "/recommendations#yashi-huang",
            },
            {
              text: "Stephanie Gascon",
              link: "/recommendations#stephanie-gascon",
            },
            {
              text: "Lim Mun Hong",
              link: "/recommendations#lim-mun-hong",
            },
            {
              text: "Hue Nguyen",
              link: "/recommendations#hue-nguyen",
            },
            {
              text: "Preston Ong Jin Bin",
              link: "/recommendations#preston-ong-jin-bin",
            },
            {
              text: "Ahmed",
              link: "/recommendations#ahmed",
            },
          ],
        },
        {
          text: "Shopee",
          link: "/recommendations#shopee",
          items: [
            {
              text: "Siyu (Henry) Tang",
              link: "/recommendations#siyu-henry-tang",
            },
            {
              text: "Joanne Tan",
              link: "/recommendations#joanne-tan",
            },
            {
              text: "Xiang Rong Ong",
              link: "/recommendations#xiang-rong-ong",
            },
            {
              text: "Laurinda Wu",
              link: "/recommendations#laurinda-wu",
            },
            {
              text: "Rachel Esther Chan",
              link: "/recommendations#rachel-esther-chan",
            },
          ],
        },
        {
          text: "Amadeus",
          link: "/recommendations#amadeus",
          items: [
            {
              text: "Gus Salamoun",
              link: "/recommendations#gus-salamoun",
            },
            {
              text: "Stephanie Tan",
              link: "/recommendations#stephanie-tan",
            },
            {
              text: "Jyolsna Elangovan",
              link: "/recommendations#jyolsna-elangovan",
            },
            {
              text: "Gwendolin Tan",
              link: "/recommendations#gwendolin-tan",
            },
            {
              text: "Jameel Shaik",
              link: "/recommendations#jameel-shaik",
            },
            {
              text: "Zeyao Liu",
              link: "/recommendations#zeyao-liu",
            },
            {
              text: "Satyaranjan Muduli",
              link: "/recommendations#satyaranjan-muduli",
            },
            {
              text: "Gopinath Gunanithi",
              link: "/recommendations#gopinath-gunanithi",
            },
            {
              text: "Thejashree Chandraiah",
              link: "/recommendations#thejashree-chandraiah",
            },
            {
              text: "Colin McKell-Redwood",
              link: "/recommendations#colin-mckell-redwood",
            },
          ],
        },
        {
          text: "Works Applications",
          link: "/recommendations#works-applications",
          items: [{ text: "Ray Pan", link: "/recommendations#ray-pan" }],
        },
        {
          text: "SUTD",
          link: "/recommendations#sutd",
          items: [{ text: "Harry Nguyen", link: "/recommendations#harry-nguyen" }],
        },
      ],
      "/resume": [
        {
          text: "Personal Profile",
          link: "/resume#personal-profile",
          items: [],
        },
        {
          text: "Core Competencies",
          link: "/resume#core-competencies",
          items: [],
        },
        {
          text: "Work Experience",
          link: "/resume#work-experience",
          items: [
            {
              text: "Workato",
              link: "/resume#workato",
            },
            {
              text: "Shopee",
              link: "/resume#shopee",
            },
            {
              text: "Amadeus IT Group",
              link: "/resume#amadeus-it-group",
            },
            {
              text: "Works Applications Co., Ltd.",
              link: "/resume#works-applications-co-ltd",
            },
          ],
        },
        {
          text: "Education",
          link: "/resume#education",
          items: [
            {
              text: "Kellogg School of Management",
              link: "/resume#kellogg-school-of-management-northwestern-university",
            },
            {
              text: "SUTD",
              link: "/resume#singapore-university-of-technology-and-design",
            },
            {
              text: "Catholic Junior College",
              link: "/resume#catholic-junior-college",
            },
          ],
        },
        {
          text: "Awards and Certifications",
          link: "/resume#awards-and-certifications",
          items: [],
        },
      ],
    },

    socialLinks: [
      { icon: "linkedin", link: "https://www.linkedin.com/in/stevanussatria" },
      { icon: "github", link: "https://github.com/stevahnes" },
      {
        icon: "researchgate",
        link: "https://www.researchgate.net/profile/Stevanus-Satria",
      },
      { icon: "strava", link: "https://www.strava.com/athletes/18347400" },
      { icon: "soundcloud", link: "https://soundcloud.com/stevanus-satria" },
    ],

    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} Stevanus Satria | Powered by VitePress`,
    },
  },

  vite: {
    plugins: [tailwindcss(), ViteImageOptimizer()] as any,
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            chat: ["./docs/.vitepress/theme/components/Chat.vue"],
            "download-resume": ["./docs/components/DownloadResume.vue"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["vue", "marked", "jspdf"],
    },
  },
});
