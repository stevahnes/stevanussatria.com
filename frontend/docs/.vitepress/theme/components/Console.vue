<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "banner";
  text: string;
  id: number;
}

// ─────────────────────────────────────────────
//  Konami sequence
// ─────────────────────────────────────────────

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────

const isOpen = ref(false);
const input = ref("");
const lines = ref<TerminalLine[]>([]);
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const lineCounter = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const outputRef = ref<HTMLDivElement | null>(null);
const konamiProgress = ref(0);
const isClient = ref(false);
const bootPhase = ref(0); // 0 = idle, 1 = booting, 2 = ready

let konamiTimeout: ReturnType<typeof setTimeout> | null = null;

// ─────────────────────────────────────────────
//  Commands registry
// ─────────────────────────────────────────────

const SHADERS = ["aurora", "velodrome", "keys", "signal", "topology"] as const;
type ShaderId = (typeof SHADERS)[number];

const COMMANDS: Record<
  string,
  {
    description: string;
    usage?: string;
    fn: (args: string[]) => string | string[];
  }
> = {
  help: {
    description: "List all available commands",
    fn: () => [
      "┌─────────────────────────────────────────────────┐",
      "│  AVAILABLE COMMANDS                              │",
      "├─────────────────────────────────────────────────┤",
      "│  chat [message]  — Open Advocado chat widget    │",
      "│  play            — Open SoundCloud player       │",
      "│  shader <name>   — Switch background shader     │",
      "│  goto <page>     — Navigate to a page           │",
      "│  clear           — Clear terminal               │",
      "│  whoami          — About this site              │",
      "│  skills          — List Steve's skills          │",
      "│  contact         — Get contact info             │",
      "│  konami          — ???                          │",
      "│  help            — Show this message            │",
      "└─────────────────────────────────────────────────┘",
      "",
      "  Shaders: aurora · velodrome · keys · signal · topology",
      "  Pages:   home · projects · blog · resume",
    ],
  },

  chat: {
    description: "Open Advocado chat widget",
    usage: "chat [optional message]",
    fn: args => {
      const message = args.join(" ").trim();
      window.dispatchEvent(
        new CustomEvent("activateChat", {
          detail: { message: message || "" },
        }),
      );
      return message
        ? [`> Advocado is listening. Pre-filled: "${message}"`]
        : ["> Advocado chat opened. Say hi 🥑"];
    },
  },

  play: {
    description: "Open the SoundCloud piano covers player",
    fn: () => {
      window.dispatchEvent(new CustomEvent("openSoundCloud"));
      return [
        "> SoundCloud player opened.",
        "> 30 piano covers — stevanussatria.com's soundtrack.",
      ];
    },
  },

  shader: {
    description: "Switch the hero background shader",
    usage: "shader <aurora|velodrome|keys|signal|topology>",
    fn: args => {
      const id = args[0]?.toLowerCase() as ShaderId;
      if (!id || !SHADERS.includes(id)) {
        return [`  Error: unknown shader "${id || ""}"`, `  Available: ${SHADERS.join(" · ")}`];
      }
      // Write to sessionStorage — ShaderBackground.vue reads this on next pick
      sessionStorage.setItem("activeShader", id);
      // Dispatch event for live switching if on home page
      window.dispatchEvent(new CustomEvent("switchShader", { detail: { id } }));
      return [`> Shader switched to "${id}". Reload homepage to confirm.`];
    },
  },

  goto: {
    description: "Navigate to a page",
    usage: "goto <home|projects|blog|resume>",
    fn: args => {
      const PAGE_MAP: Record<string, string> = {
        home: "/",
        projects: "/projects",
        blog: "/blog",
        resume: "/resume",
      };
      const dest = args[0]?.toLowerCase();
      const path = PAGE_MAP[dest];
      if (!path) {
        return [
          `  Error: unknown page "${dest || ""}"`,
          `  Available: ${Object.keys(PAGE_MAP).join(" · ")}`,
        ];
      }
      setTimeout(() => {
        window.location.href = path;
      }, 400);
      return [`> Navigating to ${path}…`];
    },
  },

  clear: {
    description: "Clear the terminal",
    fn: () => {
      lines.value = [];
      return [];
    },
  },

  whoami: {
    description: "About this site",
    fn: () => [
      "  stevanussatria.com",
      "  ───────────────────",
      "  Senior PM @ Airwallex",
      "  ex-Workato · Shopee · Amadeus",
      "  IEEE researcher · Figma plugin author",
      "  Cyclist · Pianist · Builder",
      "",
      "  Built with VitePress · Vue 3 · WebGL · TypeScript",
      "  Glassmorphism design system, shaders hand-coded in GLSL.",
    ],
  },

  skills: {
    description: "List Steve's key skills",
    fn: () => [
      "  Product          — Strategy · Roadmapping · GTM · OKRs",
      "  Engineering      — TypeScript · Vue · Python · WebGL",
      "  Design           — Figma · Design Systems · UX Research",
      "  Data             — SQL · Analytics · A/B Testing",
      "  Leadership       — 0→1 products · Cross-functional teams",
    ],
  },

  contact: {
    description: "Get contact information",
    fn: () => [
      "  LinkedIn  → linkedin.com/in/stevanussatria",
      "  GitHub    → github.com/stevanussatria",
      "  Email     → hello@stevanussatria.com",
      "",
      '  Or just type: chat "hi Steve!"',
    ],
  },

  konami: {
    description: "???",
    fn: () => [
      "  You already know about the code.",
      "  ↑ ↑ ↓ ↓ ← → ← → B A",
      "",
      "  Congratulations on finding this console.",
      "  Most visitors never see it.",
      "",
      "  Steve hid it here for people like you.",
      "  Curious. Persistent. Technically inclined.",
      "",
      "  If you're reading this and you'd like to work",
      "  with someone who builds easter eggs into their",
      "  portfolio — you know where to find him.",
    ],
  },
};

// ─────────────────────────────────────────────
//  Terminal helpers
// ─────────────────────────────────────────────

const addLine = (type: TerminalLine["type"], text: string) => {
  lines.value.push({ type, text, id: lineCounter.value++ });
};

const addLines = (type: TerminalLine["type"], texts: string[]) => {
  texts.forEach(t => addLine(type, t));
};

const scrollToBottom = async () => {
  await nextTick();
  if (outputRef.value) {
    outputRef.value.scrollTop = outputRef.value.scrollHeight;
  }
};

const BOOT_LINES = [
  "SATRIA OS v2.0.25 — stevanussatria.com",
  "Initializing kernel modules…",
  "Mounting glassmorphism subsystem… [OK]",
  "Loading WebGL shader pipeline… [OK]",
  "Connecting to Advocado chat backend… [OK]",
  "Starting SoundCloud audio daemon… [OK]",
  "All systems nominal.",
  "",
  'Type "help" to list commands.',
];

const bootTerminal = async () => {
  bootPhase.value = 1;
  lines.value = [];

  for (let i = 0; i < BOOT_LINES.length; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? 0 : 60 + Math.random() * 60));
    addLine(i === 0 ? "banner" : i === BOOT_LINES.length - 1 ? "system" : "output", BOOT_LINES[i]);
    await scrollToBottom();
  }

  bootPhase.value = 2;
  await nextTick();
  inputRef.value?.focus();
};

// ─────────────────────────────────────────────
//  Open / close
// ─────────────────────────────────────────────

const open = async () => {
  isOpen.value = true;
  await nextTick();
  await bootTerminal();
};

const close = () => {
  isOpen.value = false;
  bootPhase.value = 0;
  konamiProgress.value = 0;
};

// ─────────────────────────────────────────────
//  Command execution
// ─────────────────────────────────────────────

const execute = async (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return;

  history.value.unshift(trimmed);
  historyIndex.value = -1;
  if (history.value.length > 50) history.value.pop();

  addLine("input", `$ ${trimmed}`);

  const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);
  const command = COMMANDS[cmd];

  if (!command) {
    addLine("error", `  command not found: ${cmd}. Type "help" for commands.`);
  } else {
    const result = command.fn(args);
    const outputs = Array.isArray(result) ? result : [result];
    if (outputs.length > 0) {
      addLines("output", outputs);
    }
  }

  addLine("output", ""); // spacer
  await scrollToBottom();
};

const submit = () => {
  const val = input.value;
  input.value = "";
  execute(val);
};

// ─────────────────────────────────────────────
//  Input key handling
// ─────────────────────────────────────────────

const handleInputKey = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submit();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      input.value = history.value[historyIndex.value];
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex.value > 0) {
      historyIndex.value--;
      input.value = history.value[historyIndex.value];
    } else {
      historyIndex.value = -1;
      input.value = "";
    }
  } else if (e.key === "Tab") {
    e.preventDefault();
    // Autocomplete
    const partial = input.value.toLowerCase();
    const match = Object.keys(COMMANDS).find(c => c.startsWith(partial) && c !== partial);
    if (match) input.value = match;
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    lines.value = [];
  }
};

// ─────────────────────────────────────────────
//  Global Konami code listener
// ─────────────────────────────────────────────

const handleGlobalKey = (e: KeyboardEvent) => {
  // Don't hijack when user is typing in an input
  if (
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA"
  ) {
    // Exception: allow Escape to close console
    if (e.key === "Escape" && isOpen.value) {
      close();
      return;
    }
    // Exception: Escape closes, but don't advance konami from inputs
    if (!isOpen.value) return;
  }

  if (isOpen.value) {
    if (e.key === "Escape") close();
    return;
  }

  const expected = KONAMI[konamiProgress.value];
  if (e.key === expected) {
    konamiProgress.value++;
    if (konamiTimeout) clearTimeout(konamiTimeout);
    konamiTimeout = setTimeout(() => {
      konamiProgress.value = 0;
    }, 2000);

    if (konamiProgress.value === KONAMI.length) {
      konamiProgress.value = 0;
      open();
    }
  } else {
    konamiProgress.value = 0;
    if (konamiTimeout) clearTimeout(konamiTimeout);
  }
};

// Focus terminal on click anywhere in it
const focusInput = () => {
  if (bootPhase.value === 2) {
    inputRef.value?.focus();
  }
};

// ─────────────────────────────────────────────
//  SoundCloud open event handler
// ─────────────────────────────────────────────
// SoundCloudPlayer listens for this and calls toggleExpanded()
// We also wire up switchShader for live shader switching

const handleSwitchShader = (e: CustomEvent<{ id: string }>) => {
  // ShaderBackground.vue doesn't currently listen for events —
  // sessionStorage write alone handles it on next page load.
  // If you add an event listener to ShaderBackground.vue in the future, it'll work live.
};

// ─────────────────────────────────────────────
//  Lifecycle
// ─────────────────────────────────────────────

onMounted(() => {
  isClient.value = true;
  window.addEventListener("keydown", handleGlobalKey);
  window.addEventListener("switchShader", handleSwitchShader as EventListener);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKey);
  window.removeEventListener("switchShader", handleSwitchShader as EventListener);
  if (konamiTimeout) clearTimeout(konamiTimeout);
});

// Konami progress indicator (optional visual hint — remove if you want it fully hidden)
const progressDots = computed(() =>
  KONAMI.map((_, i) => (i < konamiProgress.value ? "●" : "○")).join(""),
);
const showProgress = computed(
  () => konamiProgress.value > 0 && konamiProgress.value < KONAMI.length,
);
</script>

<template>
  <ClientOnly>
    <!-- Konami progress indicator — subtle, bottom-center, auto-hides -->
    <Transition name="konami-hint">
      <div v-if="showProgress" class="konami-hint" aria-hidden="true">
        {{ progressDots }}
      </div>
    </Transition>

    <!-- Console overlay -->
    <Transition name="console">
      <div v-if="isOpen" class="console-overlay" @click.self="close">
        <div class="console-window" @click="focusInput">
          <!-- Title bar -->
          <div class="console-titlebar">
            <div class="titlebar-dots">
              <span class="dot dot-red" @click.stop="close" title="Close"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <span class="titlebar-title">stevanussatria.com — terminal</span>
            <span class="titlebar-esc" @click.stop="close">ESC</span>
          </div>

          <!-- Scanline overlay -->
          <div class="scanlines" aria-hidden="true"></div>

          <!-- Output area -->
          <div ref="outputRef" class="console-output">
            <div
              v-for="line in lines"
              :key="line.id"
              :class="['console-line', `line-${line.type}`]"
            >
              {{ line.text }}
            </div>

            <!-- Input row (only after boot) -->
            <div v-if="bootPhase === 2" class="console-input-row">
              <span class="prompt">$&nbsp;</span>
              <input
                ref="inputRef"
                v-model="input"
                class="console-input"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="type a command…"
                @keydown="handleInputKey"
              />
            </div>

            <!-- Boot cursor -->
            <div v-else-if="bootPhase === 1" class="boot-cursor">▋</div>
          </div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
/* ── Fonts ──────────────────────────────────────────── */
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap");

/* ── Konami progress hint ───────────────────────────── */
.konami-hint {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  color: rgba(0, 194, 168, 0.7);
  pointer-events: none;
  text-shadow: 0 0 8px rgba(0, 194, 168, 0.5);
}

.konami-hint-enter-active {
  transition: opacity 0.2s;
}

.konami-hint-leave-active {
  transition: opacity 0.4s;
}

.konami-hint-enter-from,
.konami-hint-leave-to {
  opacity: 0;
}

/* ── Console overlay ─────────────────────────────────── */
.console-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 1rem;
}

.console-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.console-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.console-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.console-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

/* ── Window chrome ───────────────────────────────────── */
.console-window {
  position: relative;
  width: min(760px, 100%);
  height: min(520px, 85vh);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0e14;
  border: 1px solid rgba(0, 194, 168, 0.25);
  box-shadow:
    0 0 0 1px rgba(0, 102, 178, 0.15),
    0 24px 80px rgba(0, 0, 0, 0.7),
    0 0 60px rgba(0, 102, 178, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  font-family: "IBM Plex Mono", "Cascadia Code", "Fira Code", monospace;
  cursor: text;
}

/* ── Titlebar ────────────────────────────────────────── */
.console-titlebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  background: #0d1117;
  border-bottom: 1px solid rgba(0, 194, 168, 0.12);
  flex-shrink: 0;
  user-select: none;
}

.titlebar-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: filter 0.15s;
}

.dot:hover {
  filter: brightness(1.3);
}

.dot-red {
  background: #ff5f57;
}

.dot-yellow {
  background: #febc2e;
}

.dot-green {
  background: #28c840;
}

.titlebar-title {
  flex: 1;
  text-align: center;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
}

.titlebar-esc {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 1px 5px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  flex-shrink: 0;
}

.titlebar-esc:hover {
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.25);
}

/* ── Scanlines ───────────────────────────────────────── */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.06) 2px,
    rgba(0, 0, 0, 0.06) 4px
  );
}

/* ── Output area ─────────────────────────────────────── */
.console-output {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
  position: relative;
  z-index: 2;
  scroll-behavior: smooth;
}

.console-output::-webkit-scrollbar {
  width: 4px;
}

.console-output::-webkit-scrollbar-track {
  background: transparent;
}

.console-output::-webkit-scrollbar-thumb {
  background: rgba(0, 194, 168, 0.2);
  border-radius: 2px;
}

/* ── Line types ──────────────────────────────────────── */
.console-line {
  font-size: 0.82rem;
  line-height: 1.65;
  white-space: pre;
  font-family: inherit;
}

.line-banner {
  color: #00c2a8;
  font-weight: 700;
  font-size: 0.88rem;
  text-shadow: 0 0 12px rgba(0, 194, 168, 0.6);
  margin-bottom: 0.15rem;
}

.line-output {
  color: rgba(220, 230, 240, 0.78);
}

.line-input {
  color: #7ab5e5;
  margin-top: 0.3rem;
}

.line-error {
  color: #ff6b6b;
}

.line-system {
  color: #28c840;
}

/* ── Input row ───────────────────────────────────────── */
.console-input-row {
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

.prompt {
  color: #00c2a8;
  font-size: 0.82rem;
  font-family: inherit;
  flex-shrink: 0;
  text-shadow: 0 0 8px rgba(0, 194, 168, 0.5);
}

.console-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.82rem;
  color: #e8f0f8;
  caret-color: #00c2a8;
  padding: 0;
  line-height: 1.65;
}

.console-input::placeholder {
  color: rgba(255, 255, 255, 0.14);
}

/* ── Boot cursor blink ───────────────────────────────── */
.boot-cursor {
  color: #00c2a8;
  font-size: 0.88rem;
  animation: blink 1s step-end infinite;
  text-shadow: 0 0 8px rgba(0, 194, 168, 0.6);
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* ── Mobile adjustments ──────────────────────────────── */
@media (max-width: 640px) {
  .console-window {
    width: 100%;
    height: 80vh;
    border-radius: 12px;
  }

  .console-line,
  .console-input,
  .prompt {
    font-size: 0.75rem;
  }
}
</style>
