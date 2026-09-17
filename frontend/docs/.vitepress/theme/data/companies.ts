/**
 * Organisations Steve has contributed to — employers first, then the
 * communities and non-profits he volunteers with.
 *
 * Employers are sourced from the experience section of docs/resume.md. Keep
 * this list as the single source of truth — CompanyCarousel.vue reads it and
 * needs no changes when entries are added, removed or reordered.
 *
 * Note the strip deliberately makes no claim about the nature of each
 * relationship; the section heading ("Where I've contributed") is what keeps a
 * mixed list of employers and volunteer work honest.
 */

/** A logo that needs separate artwork per theme, e.g. a dark-on-light wordmark. */
export interface CompanyLogo {
  dark: string;
  light: string;
}

export interface Company {
  /** Stable key for list rendering. */
  id: string;
  name: string;
  href: string;
  /**
   * Path under docs/public. Omit until the asset exists — a neutral
   * placeholder renders in its place, so a missing file is never a broken
   * image. Use a plain string when one file reads well on both themes, or
   * { dark, light } when the logo needs a per-theme variant.
   */
  logo?: string | CompanyLogo;
  /**
   * Display height in rem, overriding the default row height.
   *
   * Logos are balanced by ink area rather than by height: a square mark and a
   * wide wordmark set to the same height carry very different visual weight.
   * Values come from `height = 40 / aspectRatio ^ 0.4` (px, then / 16 for rem),
   * where aspectRatio is measured on the *trimmed* asset. The 0.4 exponent
   * dampens pure area-matching, which would otherwise shrink very wide
   * wordmarks past legibility.
   *
   * To add a logo: trim its transparent padding, take width / height of the
   * result, run it through the formula, and store the asset at ~3x the display
   * height. Originals are kept in docs/public/_logo-originals/.
   */
  logoHeight?: number;
}

// logoHeight values are derived from each trimmed asset's aspect ratio — see
// the field docs above. Trimmed aspect ratios, for reference when re-deriving:
// airwallex 1.50, workato 1.69, worksap 2.24, shopee 3.04, bettersg 3.97,
// amadeus 7.47.
export const companies: Company[] = [
  {
    id: "airwallex",
    name: "Airwallex",
    href: "https://airwallex.com",
    logo: "/airwallex.webp",
    logoHeight: 2.13,
  },
  {
    id: "workato",
    name: "Workato",
    href: "https://www.workato.com",
    logo: "/workato.webp",
    logoHeight: 2.02,
  },
  {
    id: "shopee",
    name: "Shopee",
    href: "https://shopee.sg",
    logo: "/shopee.webp",
    logoHeight: 1.6,
  },
  {
    id: "amadeus",
    name: "Amadeus",
    href: "https://www.amadeus.com",
    logo: "/amadeus.webp",
    logoHeight: 1.12,
  },
  {
    id: "works-applications",
    name: "Works Applications",
    href: "https://www.worksap.sg/",
    logo: "/worksap.webp",
    logoHeight: 1.81,
  },
  {
    id: "sutd",
    name: "SUTD",
    href: "https://www.sutd.edu.sg/",
    logo: { dark: "/sutd-dark.webp", light: "/sutd-light.webp" },
    logoHeight: 2.13,
  },

  // Communities and non-profits.
  {
    id: "better-sg",
    name: "better.sg",
    href: "https://better.sg",
    logo: { dark: "/bettersg-dark.webp", light: "/bettersg-light.webp" },
    logoHeight: 1.44,
  },
];
