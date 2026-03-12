<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter } from "vitepress";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "banner";
  text: string;
  id: number;
}

type DockPosition = "bottom" | "right";

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────

const isOpen = ref(false);
const isExecuting = ref(false); // New: Guard state
const input = ref("");
const lines = ref<TerminalLine[]>([]);
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const lineCounter = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const outputRef = ref<HTMLDivElement | null>(null);
const isClient = ref(false);
const bootPhase = ref(0); // 0=idle 1=booting 2=ready
const dockPosition = ref<DockPosition>("bottom");
const panelSize = ref(320); // px — height when bottom, width when right
const isResizing = ref(false);

// Slash command buffer
const slashBuffer = ref("");
let slashTimeout: ReturnType<typeof setTimeout> | null = null;

const router = useRouter();

const SHADERS = ["aurora", "velodrome", "keys", "signal", "topology"] as const;
type ShaderId = (typeof SHADERS)[number];

// ─────────────────────────────────────────────
//  Line helpers
// ─────────────────────────────────────────────

const addLine = (type: TerminalLine["type"], text: string) => {
  lines.value.push({ type, text, id: lineCounter.value++ });
};
const addLines = (type: TerminalLine["type"], texts: string[]) => {
  texts.forEach(t => addLine(type, t));
};
const scrollToBottom = async () => {
  await nextTick();
  if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight;
};

// ─────────────────────────────────────────────
//  Boot sequence
// ─────────────────────────────────────────────

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
    await new Promise(r => setTimeout(r, i === 0 ? 0 : 55 + Math.random() * 55));
    addLine(i === 0 ? "banner" : i === BOOT_LINES.length - 1 ? "system" : "output", BOOT_LINES[i]);
    await scrollToBottom();
  }
  bootPhase.value = 2;
  await nextTick();
  inputRef.value?.focus();
};

// ─────────────────────────────────────────────
//  Open / close / toggle dock
// ─────────────────────────────────────────────

const open = async () => {
  if (isOpen.value) return;
  isOpen.value = true;
  await nextTick();
  await bootTerminal();
};
const close = () => {
  isOpen.value = false;
  bootPhase.value = 0;
};
const toggleDock = async () => {
  dockPosition.value = dockPosition.value === "bottom" ? "right" : "bottom";
  await nextTick();
  scrollToBottom();
};

// ─────────────────────────────────────────────
//  Commands
// ─────────────────────────────────────────────

const COMMANDS: Record<
  string,
  { description: string; fn: (args: string[]) => string | string[] | Promise<string[]> }
> = {
  help: {
    description: "List commands",
    fn: () => [
      "┌──────────────────────────────────────────────────┐",
      "│  AVAILABLE COMMANDS                               │",
      "├──────────────────────────────────────────────────┤",
      "│  chat <message>  — Send a message to Advocado    │",
      "│  play            — Open & play SoundCloud         │",
      "│  shader <name>   — Switch background shader       │",
      "│  goto <page>     — Navigate to a page             │",
      "│  dock            — Toggle bottom/right panel      │",
      "│  clear           — Clear terminal                 │",
      "│  whoami          — About this site                │",
      "│  skills          — Steve's skills                 │",
      "│  contact         — Get contact info               │",
      "│  help            — Show this message              │",
      "└──────────────────────────────────────────────────┘",
      "",
      "  Shaders: aurora · velodrome · keys · signal · topology",
      "  Pages:   home · resume · projects · milestones · recommendations",
      "           ama · stack · gear · loops · skyline",
    ],
  },

  chat: {
    description: "Send a message to Advocado (auto-submits)",
    fn: args => {
      const message = args.join(" ").trim();
      if (!message) return ['  Usage: chat <message>  e.g. chat "Tell me about Steve"'];
      window.dispatchEvent(
        new CustomEvent("activateChat", {
          detail: { message, autoSend: true },
        }),
      );
      return [`> Sent to Advocado: "${message}"`];
    },
  },

  play: {
    description: "Open SoundCloud player and start playing",
    fn: async () => {
      window.dispatchEvent(new CustomEvent("openSoundCloud"));
      await new Promise<void>(resolve => {
        const onReady = () => {
          window.removeEventListener("soundCloudReady", onReady);
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(() => {
          window.removeEventListener("soundCloudReady", onReady);
          resolve();
        }, 5000);
        window.addEventListener("soundCloudReady", onReady);
      });

      window.dispatchEvent(new CustomEvent("playSoundCloud"));
      return ["> SoundCloud player opened.", "> Playback started — 30 piano covers 🎹"];
    },
  },

  shader: {
    description: "Switch the hero background shader",
    fn: args => {
      const id = args[0]?.toLowerCase() as ShaderId;
      if (!id || !SHADERS.includes(id)) {
        return [`  Error: unknown shader "${id || ""}"`, `  Available: ${SHADERS.join(" · ")}`];
      }
      sessionStorage.setItem("activeShader", id);
      window.dispatchEvent(new CustomEvent("switchShader", { detail: { id } }));
      return [`> Shader switched to "${id}".`];
    },
  },

  goto: {
    description: "Navigate to a page",
    fn: args => {
      const PAGE_MAP: Record<string, string> = {
        home: "/",
        resume: "/resume",
        projects: "/projects",
        milestones: "/milestones",
        recommendations: "/recommendations",
        ama: "/ama",
        stack: "/stack",
        gear: "/gear",
        loops: "/loops",
        skyline: "/skyline",
      };
      const dest = args[0]?.toLowerCase();
      const path = PAGE_MAP[dest];
      if (!path)
        return [
          `  Error: unknown page "${dest || ""}"`,
          `  Available: ${Object.keys(PAGE_MAP).join(" · ")}`,
        ];
      router.go(path).then(() => {
        nextTick(() => inputRef.value?.focus({ preventScroll: true }));
      });
      return [`> Navigating to ${path}…`];
    },
  },

  dock: {
    description: "Toggle panel between bottom and right",
    fn: () => {
      toggleDock();
      return [`> Panel docked to ${dockPosition.value}.`];
    },
  },

  clear: {
    description: "Clear terminal output",
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
    ],
  },

  skills: {
    description: "Steve's key skills",
    fn: () => [
      "  Product     — Strategy · Roadmapping · GTM · OKRs",
      "  Engineering — TypeScript · Vue · Python · WebGL",
      "  Design      — Figma · Design Systems · UX Research",
      "  Data        — SQL · Analytics · A/B Testing",
    ],
  },

  contact: {
    description: "Get contact info",
    fn: () => [
      "  LinkedIn  → linkedin.com/in/stevanussatria",
      "  GitHub    → github.com/stevanussatria",
      '  Or type:  chat "hi Steve!"',
    ],
  },
};

// ─────────────────────────────────────────────
//  Execute
// ─────────────────────────────────────────────

const execute = async (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed || isExecuting.value) return;

  isExecuting.value = true; // Lock the terminal

  try {
    history.value.unshift(trimmed);
    historyIndex.value = -1;
    if (history.value.length > 50) history.value.pop();

    addLine("input", `$ ${trimmed}`);

    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);
    const rawArgs = trimmed.split(/\s+/).slice(1);

    const command = COMMANDS[cmd];
    if (!command) {
      addLine("error", `  command not found: ${cmd}. Type "help" for commands.`);
    } else {
      const result = await Promise.resolve(command.fn(rawArgs));
      const outputs = Array.isArray(result) ? result : [result];
      if (outputs.length > 0) addLines("output", outputs);
    }
    addLine("output", "");
  } catch (err) {
    addLine("error", "  An internal execution error occurred.");
    console.error(err);
  } finally {
    isExecuting.value = false; // Unlock
    await scrollToBottom();
    await nextTick();
    inputRef.value?.focus({ preventScroll: true });
  }
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
  if (isExecuting.value) return; // Ignore keys while busy

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
    const partial = input.value.toLowerCase();
    const match = Object.keys(COMMANDS).find(c => c.startsWith(partial) && c !== partial);
    if (match) input.value = match;
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    lines.value = [];
  }
};

// ─────────────────────────────────────────────
//  Slash command detection
// ─────────────────────────────────────────────

const TRIGGER = "/terminal";

const handleGlobalKey = (e: KeyboardEvent) => {
  const tag = (document.activeElement?.tagName ?? "").toLowerCase();
  const isTyping =
    tag === "input" ||
    tag === "textarea" ||
    document.activeElement?.getAttribute("contenteditable");

  if (e.key === "Escape" && isOpen.value) {
    close();
    return;
  }

  if (isOpen.value) return;
  if (isTyping) return;

  if (e.key === "Escape") {
    slashBuffer.value = "";
    return;
  }

  if (e.key.length > 1 && e.key !== "Backspace") return;

  if (e.key === "Backspace") {
    slashBuffer.value = slashBuffer.value.slice(0, -1);
  } else {
    slashBuffer.value += e.key;
  }

  if (slashTimeout) clearTimeout(slashTimeout);
  slashTimeout = setTimeout(() => (slashBuffer.value = ""), 2500);

  if (slashBuffer.value === TRIGGER) {
    slashBuffer.value = "";
    if (slashTimeout) clearTimeout(slashTimeout);
    open();
  }
};

// ─────────────────────────────────────────────
//  Resize drag
// ─────────────────────────────────────────────

const startResize = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isResizing.value = true;

  const startPos = "touches" in e ? e.touches[0].clientY : e.clientY;
  const startPosX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const startSize = panelSize.value;

  const onMove = (ev: MouseEvent | TouchEvent) => {
    const clientY = "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
    const clientX = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
    if (dockPosition.value === "bottom") {
      const delta = startPos - clientY;
      panelSize.value = Math.max(180, Math.min(window.innerHeight * 0.85, startSize + delta));
    } else {
      const delta = startPosX - clientX;
      panelSize.value = Math.max(260, Math.min(window.innerWidth * 0.6, startSize + delta));
    }
  };

  const onUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMove as EventListener);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMove as EventListener);
    window.removeEventListener("touchend", onUp);
  };

  window.addEventListener("mousemove", onMove as EventListener);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchmove", onMove as EventListener, { passive: false });
  window.addEventListener("touchend", onUp);
};

const focusInput = () => {
  if (bootPhase.value === 2 && !isExecuting.value) inputRef.value?.focus();
};

// ─────────────────────────────────────────────
//  Computed panel styles
// ─────────────────────────────────────────────

const panelStyle = computed(() => {
  if (dockPosition.value === "bottom") {
    return {
      height: `${panelSize.value}px`,
      width: "100%",
      bottom: "0",
      left: "0",
      right: "0",
      top: "auto",
    };
  } else {
    return {
      width: `${panelSize.value}px`,
      height: "100%",
      right: "0",
      top: "0",
      bottom: "0",
      left: "auto",
    };
  }
});

const slashVisible = computed(
  () => slashBuffer.value.length > 0 && slashBuffer.value.startsWith("/"),
);

// ─────────────────────────────────────────────
//  Lifecycle
// ─────────────────────────────────────────────

onMounted(() => {
  isClient.value = true;
  window.addEventListener("keydown", handleGlobalKey);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKey);
  if (slashTimeout) clearTimeout(slashTimeout);
});
</script>

<template>
  <ClientOnly>
    <Transition name="slash-hint">
      <div v-if="slashVisible && !isOpen" class="slash-hint" aria-hidden="true">
        {{ slashBuffer }}<span class="slash-cursor">▋</span>
      </div>
    </Transition>

    <Transition :name="dockPosition === 'bottom' ? 'slide-up' : 'slide-right'">
      <div
        v-if="isOpen"
        class="console-panel"
        :class="[`dock-${dockPosition}`, { 'is-resizing': isResizing }]"
        :style="panelStyle"
        @click="focusInput"
      >
        <div
          class="resize-handle"
          :class="`resize-${dockPosition}`"
          @mousedown="startResize"
          @touchstart.prevent="startResize"
        ></div>

        <div class="console-titlebar">
          <div class="titlebar-dots">
            <span class="dot dot-red" @click.stop="close" title="Close"></span>
            <span class="dot dot-yellow" @click.stop="toggleDock" title="Toggle dock"></span>
            <span class="dot dot-green"></span>
          </div>
          <span class="titlebar-title">
            stevanussatria.com — terminal
            <span class="titlebar-hint">{{
              dockPosition === "bottom" ? "⊡ bottom" : "⊞ right"
            }}</span>
          </span>
          <div class="titlebar-actions">
            <button class="titlebar-btn" @click.stop="toggleDock" title="Toggle dock position">
              {{ dockPosition === "bottom" ? "⇥" : "⇩" }}
            </button>
            <button class="titlebar-btn" @click.stop="close" title="Close (Esc)">✕</button>
          </div>
        </div>

        <div class="scanlines" aria-hidden="true"></div>

        <div ref="outputRef" class="console-output">
          <div v-for="line in lines" :key="line.id" :class="['console-line', `line-${line.type}`]">
            {{ line.text }}
          </div>

          <div v-if="bootPhase === 2" class="console-input-row" :class="{ 'is-busy': isExecuting }">
            <span class="prompt">$&nbsp;</span>
            <input
              ref="inputRef"
              v-model="input"
              class="console-input"
              :disabled="isExecuting"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="isExecuting ? 'processing...' : 'type a command…'"
              @keydown="handleInputKey"
            />
          </div>
          <div v-else-if="bootPhase === 1" class="boot-cursor">▋</div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap");

/* ── Slash hint ───────────────────────────── */
.slash-hint {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  color: rgba(0, 194, 168, 0.85);
  background: rgba(10, 14, 20, 0.82);
  border: 1px solid rgba(0, 194, 168, 0.2);
  border-radius: 6px;
  padding: 0.25rem 0.65rem;
  letter-spacing: 0.05em;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-shadow: 0 0 10px rgba(0, 194, 168, 0.5);
}

.slash-cursor {
  animation: blink 1s step-end infinite;
}

.slash-hint-enter-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.slash-hint-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.slash-hint-enter-from,
.slash-hint-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* ── Panel ─────────────────────────────────── */
.console-panel {
  position: fixed;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  background: #0a0e14;
  font-family: "IBM Plex Mono", "Cascadia Code", "Fira Code", monospace;
  pointer-events: auto;
  overflow: hidden;
}

.dock-bottom {
  border-top: 1px solid rgba(0, 194, 168, 0.25);
  box-shadow:
    0 -8px 40px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(0, 102, 178, 0.06);
}

.dock-right {
  border-left: 1px solid rgba(0, 194, 168, 0.25);
  box-shadow:
    -8px 0 40px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(0, 102, 178, 0.06);
}

/* ── Transitions ─────────────────────────── */
.slide-up-enter-active {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.2s;
}

.slide-up-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.15s;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-right-enter-active {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.2s;
}

.slide-right-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.15s;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Resize handle ───────────────────────── */
.resize-handle {
  flex-shrink: 0;
  background: transparent;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: rgba(0, 194, 168, 0.15);
}

.resize-bottom {
  height: 5px;
  width: 100%;
  cursor: ns-resize;
}

.resize-right {
  width: 5px;
  height: 100%;
  cursor: ew-resize;
  position: absolute;
  left: 0;
  top: 0;
}

/* ── Titlebar ────────────────────────────── */
.console-titlebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
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
  filter: brightness(1.35);
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
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.05em;
}

.titlebar-hint {
  margin-left: 0.5rem;
  font-size: 0.6rem;
  color: rgba(0, 194, 168, 0.4);
}

.titlebar-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.titlebar-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  font-family: inherit;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.titlebar-btn:hover {
  color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.25);
}

/* ── Scanlines ───────────────────────────── */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.055) 2px,
    rgba(0, 0, 0, 0.055) 4px
  );
}

/* ── Output area ─────────────────────────── */
.console-output {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
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

/* ── Lines ───────────────────────────────── */
.console-line {
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre;
  font-family: inherit;
}

.line-banner {
  color: #00c2a8;
  font-weight: 700;
  font-size: 0.85rem;
  text-shadow: 0 0 12px rgba(0, 194, 168, 0.55);
}

.line-output {
  color: rgba(220, 230, 240, 0.75);
}

.line-input {
  color: #7ab5e5;
  margin-top: 0.25rem;
}

.line-error {
  color: #ff6b6b;
}

.line-system {
  color: #28c840;
}

/* ── Input row ───────────────────────────── */
.console-input-row {
  display: flex;
  align-items: center;
  margin-top: 0.2rem;
  transition: opacity 0.2s ease;
}

.console-input-row.is-busy {
  opacity: 0.5;
  pointer-events: none;
}

.prompt {
  color: #00c2a8;
  font-size: 0.8rem;
  font-family: inherit;
  flex-shrink: 0;
  text-shadow: 0 0 8px rgba(0, 194, 168, 0.45);
}

.console-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.8rem;
  color: #e8f0f8;
  caret-color: #00c2a8;
  padding: 0;
  line-height: 1.6;
}

.console-input:disabled {
  cursor: wait;
}

.console-input::placeholder {
  color: rgba(255, 255, 255, 0.12);
}

/* ── Boot cursor ─────────────────────────── */
.boot-cursor {
  color: #00c2a8;
  font-size: 0.85rem;
  animation: blink 1s step-end infinite;
  text-shadow: 0 0 8px rgba(0, 194, 168, 0.55);
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

@media (max-width: 640px) {
  .console-panel {
    width: 100% !important;
    right: 0 !important;
    left: 0 !important;
  }

  .console-line,
  .console-input,
  .prompt {
    font-size: 0.72rem;
  }
}
</style>
