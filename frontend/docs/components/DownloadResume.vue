<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import jsPDF from "jspdf";
import { Resume } from "./resume_builder/models";
import { Cursor } from "./resume_builder/class";
import { parseResumeMarkdown } from "./resume_builder/mapper";
import { OnePageStandard } from "./resume_builder/templates/one-page-standard/constants";
import { generateOnePageStandardPDF } from "./resume_builder/templates/one-page-standard/logic";
import { useData } from "vitepress";

// --- Enhanced Types ---
interface Props {
  filename?: string;
  buttonText?: string;
  openInNewTab?: boolean;
}

interface HTMLTagProcessor {
  [key: string]: (el: HTMLElement, processChildren: () => string) => string;
}

// --- Constants ---
const DEFAULT_FILENAME = "Stevanus SATRIA.pdf";
const DEFAULT_BUTTON_TEXT = "Download Resume";
const HYDRATION_DELAY = 100;

const PDF_CONFIG = {
  orientation: "portrait" as const,
  unit: "mm" as const,
  format: "a4" as const,
} as const;

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  filename: DEFAULT_FILENAME,
  buttonText: DEFAULT_BUTTON_TEXT,
  openInNewTab: false,
});

// --- State ---
const isClient = ref(false);
const isReady = ref(false);
const resumeMarkdown = ref<string>("");

// --- Theme ---
const { isDark } = useData();

// --- Computed ---
const buttonClasses = computed(() => [
  "!border-none !py-2.5 !px-6 !text-center !no-underline !inline-block !text-base !m-1 !cursor-pointer !rounded-full !font-medium !transition-all !duration-300 !shadow-sm",
  "!font-sans !tracking-wide",
  isDark.value ? "!bg-[#0059aa] hover:!bg-[#004c91]" : "!bg-[#3e94e8] hover:!bg-[#2a7fd1]",
  "!text-white",
]);

const loadingButtonClasses = [
  "!border-none !py-2.5 !px-6 !text-center !no-underline !inline-block !text-base !m-1 !cursor-wait !rounded-full !font-medium !transition-all !duration-300 !shadow-sm !font-sans !tracking-wide !bg-gray-400 !text-white",
];

// --- HTML to Markdown Processing ---
const htmlTagProcessors: HTMLTagProcessor = {
  h1: (_, processChildren) => `# ${processChildren()}\n\n`,
  h2: (_, processChildren) => `## ${processChildren()}\n\n`,
  h3: (_, processChildren) => `### ${processChildren()}\n\n`,
  p: (_, processChildren) => `${processChildren()}\n\n`,
  ul: el => {
    let listItems = "";
    el.querySelectorAll("li").forEach(li => {
      listItems += `- ${processNode(li)}\n`;
    });
    return listItems + "\n";
  },
  li: (_, processChildren) => processChildren(),
  a: el => `[${el.textContent}](${el.getAttribute("href")})`,
  strong: (_, processChildren) => `**${processChildren()}**`,
  b: (_, processChildren) => `**${processChildren()}**`,
  br: () => "\n",
};

// --- Utility Functions ---
const processNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    const processChildren = (): string => {
      let content = "";
      el.childNodes.forEach(child => {
        content += processNode(child);
      });
      return content;
    };

    const processor = htmlTagProcessors[tagName];
    return processor ? processor(el, processChildren) : processChildren();
  }

  return "";
};

const getMarkdownFromHTML = (element: HTMLElement): string => {
  let markdown = "";
  element.childNodes.forEach(child => {
    markdown += processNode(child);
  });
  return markdown;
};

const extractResumeContent = (): void => {
  if (!isClient.value) return;

  const contentElement = document.querySelector(".vp-doc");
  if (!contentElement) {
    console.error("Could not find VitePress markdown content");
    return;
  }

  const contentClone = contentElement.cloneNode(true) as HTMLElement;

  // Remove all button elements (including loading and download buttons)
  contentClone.querySelectorAll("button").forEach(btn => btn.remove());

  // Remove chat components that might be embedded in the page
  const chatComponents = contentClone.querySelectorAll(
    '[class*="chat"], [id*="chat"], [class*="Chat"]',
  );
  chatComponents.forEach(component => component.remove());

  // Remove any fixed positioned elements (like mini chat)
  const fixedElements = contentClone.querySelectorAll('[class*="fixed"], [style*="fixed"]');
  fixedElements.forEach(element => element.remove());

  // Remove any elements that contain "Advocado" to avoid chat content
  const advocadoElements = contentClone.querySelectorAll("*");
  advocadoElements.forEach(element => {
    if (
      element.textContent?.includes("Chat with Advocado") ||
      element.textContent?.includes("Advocado")
    ) {
      element.remove();
    }
  });

  resumeMarkdown.value = getMarkdownFromHTML(contentClone);
};

const createPDFBlob = (doc: jsPDF): Blob => doc.output("blob");

const openPDFInNewTab = (doc: jsPDF): void => {
  const pdfBlob = createPDFBlob(doc);
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  Object.assign(link, {
    href: pdfUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    download: props.filename,
  });

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object after a delay
  setTimeout(() => URL.revokeObjectURL(pdfUrl), HYDRATION_DELAY);
};

const savePDFDirectly = (doc: jsPDF): void => {
  doc.save(props.filename);
};

// --- Main Functions ---
const generatePDF = (): jsPDF => {
  const resume: Resume = parseResumeMarkdown(resumeMarkdown.value);
  const doc = new jsPDF(PDF_CONFIG);
  const cursor = new Cursor(0, 0, OnePageStandard.HEADER_FONT_SIZE);

  generateOnePageStandardPDF(resume, doc, cursor);
  return doc;
};

const downloadResume = (): void => {
  if (!isClient.value || !resumeMarkdown.value) {
    if (!resumeMarkdown.value) {
      console.error("Resume markdown content not found");
    }
    return;
  }

  try {
    const doc = generatePDF();

    if (props.openInNewTab) {
      openPDFInNewTab(doc);
    } else {
      savePDFDirectly(doc);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

// --- Lifecycle ---
onMounted(() => {
  isClient.value = true;

  // Small delay to ensure proper hydration
  setTimeout(() => {
    isReady.value = true;
    extractResumeContent();
  }, HYDRATION_DELAY);
});
</script>

<template>
  <button v-if="isReady" data-download-resume :class="buttonClasses" @click="downloadResume">
    {{ props.buttonText }}
  </button>
  <button v-else :class="loadingButtonClasses">Loading...</button>
</template>

<style scoped>
/* No additional styles needed as we're using Tailwind with !important flags */
</style>
