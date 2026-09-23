import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import Bookshelf from "../Bookshelf.vue";

interface MediaItem {
  id: string; // e.g., "book-escaping-build-trap"
  type: "book" | "podcast" | "movie" | "show" | "article"; // Media type
  title: string;
  authorOrHost: string;
  status: "consuming" | "completed" | "queued" | "paused";
  coverImage?: string; // URL or local path
  link: string; // External link to Spotify, Goodreads, or SG Library (NLB)
}
// No more dynamic import/mock machinery — component is now props-driven

async function mountBookshelf(items?: MediaItem[]): Promise<VueWrapper> {
  const wrapper = mount(Bookshelf, { props: { items: items } });
  await flushPromises();
  return wrapper;
}

const mixedMediaData: MediaItem[] = [
  {
    id: "book-one",
    type: "book",
    title: "Zoo Book",
    authorOrHost: "Author A",
    status: "consuming",
    link: "https://example.com/book-one",
  },
  {
    id: "podcast-one",
    type: "podcast",
    title: "Alpha Podcast",
    authorOrHost: "Host Z",
    status: "queued",
    link: "https://example.com/podcast-one",
  },
  {
    id: "article-one",
    type: "article",
    title: "Middle Article",
    authorOrHost: "Publication M",
    status: "completed",
    link: "https://example.com/article-one",
  },
];

describe("Bookshelf", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders bookshelf header copy", async () => {
    const wrapper = await mountBookshelf();
    expect(wrapper.find(".eyebrow").text()).toBe("Steve's Library");
    expect(wrapper.find(".title").text()).toBe("Bookshelf");
  });

  it("renders all filter buttons after mount", async () => {
    const wrapper = await mountBookshelf();
    const labels = wrapper.findAll("button.filter-button").map(b => b.text());
    expect(labels).toEqual(["All", "Books", "Podcasts", "Articles"]);
  });

  it("sorts cards by status by default", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const titles = wrapper.findAll(".media-card .media-title").map(el => el.text());
    expect(titles).toEqual(["Zoo Book", "Alpha Podcast", "Middle Article"]);
  });

  it("sorts cards by title when title sort is selected", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const sortButtons = wrapper.findAll("button.sort-button");
    await sortButtons[1].trigger("click"); // Title
    await flushPromises();

    const titles = wrapper.findAll(".media-card .media-title").map(el => el.text());
    expect(titles).toEqual(["Alpha Podcast", "Middle Article", "Zoo Book"]);
  });

  it("sorts cards by author when author sort is selected", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const sortButtons = wrapper.findAll("button.sort-button");
    await sortButtons[2].trigger("click"); // Author
    await flushPromises();

    const titles = wrapper.findAll(".media-card .media-title").map(el => el.text());
    expect(titles).toEqual(["Zoo Book", "Alpha Podcast", "Middle Article"]);
  });

  it("shows featured class for currently consuming items", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const featured = wrapper.findAll(".media-card.is-featured");
    expect(featured.length).toBeGreaterThanOrEqual(1);
    expect(featured.every(card => card.classes().includes("status-consuming"))).toBe(true);
  });

  it("filters items by type when filter button is clicked", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);

    await wrapper.findAll("button.filter-button")[1].trigger("click"); // Books
    await flushPromises();
    expect(wrapper.findAll(".media-card")).toHaveLength(1);

    await wrapper.findAll("button.filter-button")[2].trigger("click"); // Podcasts
    await flushPromises();
    expect(wrapper.findAll(".media-card")).toHaveLength(1);

    await wrapper.findAll("button.filter-button")[3].trigger("click"); // Articles
    await flushPromises();
    expect(wrapper.findAll(".media-card")).toHaveLength(1);
  });

  it("renders a single source CTA per card", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const cards = wrapper.findAll(".media-card");
    const sourceButtons = wrapper.findAll("a.source-button");
    expect(sourceButtons.length).toBe(cards.length);
    expect(sourceButtons.every(btn => btn.text() === "View source")).toBe(true);
  });

  it("source CTA points to item link", async () => {
    const wrapper = await mountBookshelf(mixedMediaData);
    const firstLink = wrapper.find("a.source-button");
    expect(firstLink.attributes("href")).toBe("https://example.com/book-one");
  });

  it("renders empty state for empty dataset", async () => {
    const wrapper = await mountBookshelf([]);
    expect(wrapper.find(".empty-state").exists()).toBe(true);
    expect(wrapper.text()).toContain("No media items in this filter yet.");
  });

  it("renders empty state when no props passed", async () => {
    const wrapper = await mountBookshelf();
    expect(wrapper.find(".empty-state").exists()).toBe(true);
  });

  it("filters out invalid data rows via MediaItem type guard", async () => {
    const custom = [
      {
        id: "book-valid",
        type: "book",
        title: "Valid Book",
        authorOrHost: "Valid Author",
        status: "queued",
        link: "https://example.com/valid-book",
      },
      {
        id: "bad-row",
        type: "newsletter", // invalid type
        title: "Should be excluded",
      },
    ];

    const wrapper = await mountBookshelf(custom as MediaItem[]);
    const cards = wrapper.findAll(".media-card");
    expect(cards).toHaveLength(1);
    expect(wrapper.text()).toContain("Valid Book");
    expect(wrapper.text()).not.toContain("Should be excluded");
  });
});
