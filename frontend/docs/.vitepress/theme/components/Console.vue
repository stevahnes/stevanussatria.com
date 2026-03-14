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

type DockPosition = "bottom" | "right" | "float";

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
const isClient = ref(false);
const bootPhase = ref(0); // 0=idle 1=booting 2=ready
const dockPosition = ref<DockPosition>("float");
const dockedSize = ref(320); // px — height when bottom, width when right

// Float state
const floatX = ref(0);
const floatY = ref(0);
const floatW = ref(640);
const floatH = ref(420);
const isDragging = ref(false);
const isResizing = ref(false);

// Glitch mode
const isGlitching = ref(false);
let glitchIntervals: ReturnType<typeof setInterval>[] = [];
let glitchTimeouts: ReturnType<typeof setTimeout>[] = [];

// Slash command buffer
const slashBuffer = ref("");
let slashTimeout: ReturnType<typeof setTimeout> | null = null;

const router = useRouter();
const { isDark } = useData();

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
//  Open / close / dock
// ─────────────────────────────────────────────

const open = async () => {
  if (isOpen.value) return;
  // Centre float window on first open (or if still at default 0,0)
  if (dockPosition.value === "float" && floatX.value === 0 && floatY.value === 0) {
    floatX.value = Math.round((window.innerWidth - floatW.value) / 2);
    floatY.value = Math.round((window.innerHeight - floatH.value) / 2);
  }
  isOpen.value = true;
  await nextTick();
  await bootTerminal();
};
const close = () => {
  isOpen.value = false;
  bootPhase.value = 0;
};

// Cycle: bottom → right → float → bottom
const cycleDock = async () => {
  if (dockPosition.value === "bottom") {
    dockPosition.value = "right";
  } else if (dockPosition.value === "right") {
    // Entering float: centre on screen
    floatX.value = Math.round((window.innerWidth - floatW.value) / 2);
    floatY.value = Math.round((window.innerHeight - floatH.value) / 2);
    dockPosition.value = "float";
  } else {
    dockPosition.value = "bottom";
  }
  await nextTick();
  scrollToBottom();
};

// Green dot: toggle float ↔ last docked position
const prevDock = ref<"bottom" | "right">("bottom");
const popOut = async () => {
  if (dockPosition.value !== "float") {
    prevDock.value = dockPosition.value as "bottom" | "right";
    floatX.value = Math.round((window.innerWidth - floatW.value) / 2);
    floatY.value = Math.round((window.innerHeight - floatH.value) / 2);
    dockPosition.value = "float";
  } else {
    dockPosition.value = prevDock.value;
  }
  await nextTick();
  scrollToBottom();
};

// ─────────────────────────────────────────────
//  Glitch mode
// ─────────────────────────────────────────────

const GLITCH_CHARS = [
  "▋",
  "$",
  ">",
  "_",
  "░",
  "▒",
  "▓",
  "//",
  "01",
  ">>",
  "<<",
  "!!",
  "??",
  "##",
  "~~",
];
const GLITCH_SHADERS = ["aurora", "velodrome", "keys", "signal", "topology"];
const GLITCH_COLORS = ["#ff5f57", "#febc2e", "#28c840", "#00c2a8", "#7ab5e5", "#ff79c6", "#bd93f9"];

const stopGlitch = () => {
  isGlitching.value = false;
  glitchIntervals.forEach(clearInterval);
  glitchTimeouts.forEach(clearTimeout);
  glitchIntervals = [];
  glitchTimeouts = [];
  // Restore body
  document.body.style.animation = "";
  document.body.style.transform = "";
  // Restore banner color
  const banners = document.querySelectorAll<HTMLElement>(".line-banner");
  banners.forEach(el => {
    el.style.color = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.textShadow = "";
  });
  // Restore prompt
  const prompts = document.querySelectorAll<HTMLElement>(".prompt");
  prompts.forEach(el => {
    el.style.color = "";
    el.style.textShadow = "";
  });
};

const startGlitch = () => {
  isGlitching.value = true;

  // ── 1. Shader rapid-cycle ──
  let shaderIdx = 0;
  glitchIntervals.push(
    setInterval(() => {
      shaderIdx = (shaderIdx + 1) % GLITCH_SHADERS.length;
      const id = GLITCH_SHADERS[shaderIdx];
      sessionStorage.setItem("activeShader", id);
      window.dispatchEvent(new CustomEvent("switchShader", { detail: { id } }));
    }, 800),
  );

  // ── 2. Banner flicker + color + glitch ──
  glitchIntervals.push(
    setInterval(() => {
      const banners = document.querySelectorAll<HTMLElement>(".line-banner");
      const color = GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)];
      const offsetX = (Math.random() - 0.5) * 12;
      const opacity = Math.random() > 0.15 ? 1 : 0;
      banners.forEach(el => {
        el.style.color = color;
        el.style.transform = `translateX(${offsetX}px)`;
        el.style.opacity = String(opacity);
        el.style.textShadow = `0 0 16px ${color}`;
      });
    }, 80),
  );

  // ── 3. Prompt color cycle ──
  let promptColorIdx = 0;
  glitchIntervals.push(
    setInterval(() => {
      const prompts = document.querySelectorAll<HTMLElement>(".prompt");
      const color = GLITCH_COLORS[promptColorIdx % GLITCH_COLORS.length];
      prompts.forEach(el => {
        el.style.color = color;
        el.style.textShadow = `0 0 8px ${color}`;
      });
      promptColorIdx++;
    }, 120),
  );

  // ── 4. Body shake ──
  glitchIntervals.push(
    setInterval(() => {
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 4;
      document.body.style.transform = `translate(${x}px, ${y}px)`;
    }, 50),
  );

  // ── 5. ASCII confetti rain into terminal ──
  glitchIntervals.push(
    setInterval(() => {
      if (!isGlitching.value) return;
      const chars = Array.from(
        { length: 6 },
        () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
      ).join(" ");
      addLine("banner", "  " + chars);
      scrollToBottom();
    }, 300),
  );

  // ── 6. Auto-play SoundCloud ──
  window.dispatchEvent(new CustomEvent("openSoundCloud"));
  const scTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent("playSoundCloud"));
  }, 1000);
  glitchTimeouts.push(scTimer);

  // ── 7. Auto-stop after 15s ──
  const autoStop = setTimeout(() => {
    if (isGlitching.value) {
      stopGlitch();
      addLine("system", "> Glitch mode terminated. Systems restored.");
      addLine("output", "");
      scrollToBottom();
    }
  }, 15000);
  glitchTimeouts.push(autoStop);
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
      "  AVAILABLE COMMANDS",
      "  ────────────────────────────────────────────────────────",
      "  chat <message>            — Send a message to Advocado",
      "  soundcloud <subcommand>   — Control SoundCloud Player",
      "  shader <n>                — Switch background shader",
      "  goto <page>               — Navigate to a page",
      "  dock                      — Cycle bottom → right → float",
      "  clear                     — Clear terminal",
      "  whoami                    — About this site",
      "  skills                    — Steve's skills",
      "  contact                   — Get contact info",
      "  help                      — Show this message",
      "  theme [light|dark]        — Toggle or set site theme",
      "  glitch                    — 👾 Unleash chaos (type again to stop)",
      "  ────────────────────────────────────────────────────────",
      "  SoundCloud:  play · pause · next · prev",
      "  Shaders:     aurora · velodrome · keys · signal · topology",
      "  Pages:       home · resume · projects · milestones · ama",
      "               recommendations · stack · gear · loops · skyline",
    ],
  },

  chat: {
    description: "Send a message to Advocado (auto-submits)",
    fn: args => {
      const message = args.join(" ").trim();
      if (!message) return ['  Usage: chat <message>  e.g. chat "Tell me about Steve"'];
      window.dispatchEvent(
        new CustomEvent("activateChat", { detail: { message, autoSend: true } }),
      );
      return [`> Sent to Advocado: "${message}"`];
    },
  },

  soundcloud: {
    description: "Control the SoundCloud player",
    fn: async args => {
      const sub = args[0]?.toLowerCase();
      const SUBS = ["play", "pause", "next", "prev"];
      if (!sub || !SUBS.includes(sub)) {
        return [`  Usage: soundcloud <subcommand>`, `  Subcommands: ${SUBS.join(" · ")}`];
      }
      if (sub === "play") {
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
        return ["> SoundCloud opened.", "> Playback started — 30 piano covers 🎹"];
      }
      if (sub === "pause") {
        window.dispatchEvent(new CustomEvent("pauseSoundCloud"));
        return ["> Playback paused."];
      }
      if (sub === "next") {
        window.dispatchEvent(new CustomEvent("nextSoundCloud"));
        return ["> Skipped to next track."];
      }
      if (sub === "prev") {
        window.dispatchEvent(new CustomEvent("prevSoundCloud"));
        return ["> Went back to previous track."];
      }
      return [];
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
      router.go(path).then(() => nextTick(() => inputRef.value?.focus({ preventScroll: true })));
      return [`> Navigating to ${path}…`];
    },
  },

  dock: {
    description: "Cycle panel: bottom → right → float",
    fn: () => {
      cycleDock();
      return [
        `> Mode: ${dockPosition.value === "float" ? "floating" : "docked " + dockPosition.value}.`,
      ];
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

  theme: {
    description: "Toggle or set light/dark mode",
    fn: args => {
      const sub = args[0]?.toLowerCase();
      if (sub === "light") {
        isDark.value = false;
        return ["> Switched to light mode."];
      }
      if (sub === "dark") {
        isDark.value = true;
        return ["> Switched to dark mode."];
      }
      isDark.value = !isDark.value;
      return [`> Switched to ${isDark.value ? "dark" : "light"} mode.`];
    },
  },

  glitch: {
    description: "👾 Toggle glitch mode — chaos ensues",
    fn: () => {
      if (isGlitching.value) {
        stopGlitch();
        return ["> Glitch mode terminated. Systems restored."];
      }
      startGlitch();
      return [
        "> ⚠ INITIATING GLITCH SEQUENCE ⚠",
        "> Reality destabilising…",
        '> Type "glitch" again to stop.',
      ];
    },
  },
};

// ─────────────────────────────────────────────
//  Execute
// ─────────────────────────────────────────────

const execute = async (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return;
  history.value.unshift(trimmed);
  historyIndex.value = -1;
  if (history.value.length > 50) history.value.pop();
  addLine("input", `$ ${trimmed}`);
  const rawArgs = trimmed.split(/\s+/).slice(1);
  const cmd = trimmed.toLowerCase().split(/\s+/)[0];
  const command = COMMANDS[cmd];
  if (!command) {
    addLine("error", `  command not found: ${cmd}. Type "help" for commands.`);
  } else {
    const result = await Promise.resolve(command.fn(rawArgs));
    const outputs = Array.isArray(result) ? result : [result];
    if (outputs.length > 0) addLines("output", outputs);
  }
  addLine("output", "");
  await scrollToBottom();
  await nextTick();
  inputRef.value?.focus({ preventScroll: true });
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
    const partial = input.value.toLowerCase();
    const match = Object.keys(COMMANDS).find(c => c.startsWith(partial) && c !== partial);
    if (match) input.value = match;
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    lines.value = [];
  }
};

// ─────────────────────────────────────────────
//  Global key — /terminal trigger
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
  if (isOpen.value || isTyping) return;
  if (e.key === "Escape") {
    slashBuffer.value = "";
    return;
  }
  if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Enter") return;
  if (e.key === "Backspace") {
    slashBuffer.value = slashBuffer.value.slice(0, -1);
  } else if (e.key === "Enter") {
    if (slashBuffer.value === TRIGGER) {
      slashBuffer.value = "";
      if (slashTimeout) clearTimeout(slashTimeout);
      open();
    } else {
      slashBuffer.value = "";
      if (slashTimeout) clearTimeout(slashTimeout);
    }
    return;
  } else {
    slashBuffer.value += e.key;
  }
  if (slashTimeout) clearTimeout(slashTimeout);
  slashTimeout = setTimeout(() => (slashBuffer.value = ""), 2500);
};

// ─────────────────────────────────────────────
//  Dragging — float mode only, via titlebar
// ─────────────────────────────────────────────

const startDrag = (e: MouseEvent) => {
  if (dockPosition.value !== "float") return;
  // Don't drag if clicking buttons inside titlebar
  if ((e.target as HTMLElement).closest(".titlebar-actions, .titlebar-dots")) return;
  e.preventDefault();
  isDragging.value = true;

  const offsetX = e.clientX - floatX.value;
  const offsetY = e.clientY - floatY.value;

  const onMove = (ev: MouseEvent) => {
    floatX.value = Math.max(0, Math.min(window.innerWidth - floatW.value, ev.clientX - offsetX));
    floatY.value = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - offsetY));
  };
  const onUp = () => {
    isDragging.value = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

// ─────────────────────────────────────────────
//  Resizing
//  Docked: drag the single edge handle
//  Float:  drag any of 8 directional handles
// ─────────────────────────────────────────────

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | "docked";

const startResize = (e: MouseEvent | TouchEvent, dir: ResizeDir) => {
  e.preventDefault();
  isResizing.value = true;

  const startMX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const startMY = "touches" in e ? e.touches[0].clientY : e.clientY;
  const startDockedSize = dockedSize.value;
  const startX = floatX.value,
    startY = floatY.value;
  const startW = floatW.value,
    startH = floatH.value;
  const MIN_W = 320,
    MIN_H = 200;

  const onMove = (ev: MouseEvent | TouchEvent) => {
    const mx = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
    const my = "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
    const dx = mx - startMX;
    const dy = my - startMY;

    if (dir === "docked") {
      if (dockPosition.value === "bottom") {
        dockedSize.value = Math.max(180, Math.min(window.innerHeight * 0.85, startDockedSize - dy));
      } else {
        dockedSize.value = Math.max(260, Math.min(window.innerWidth * 0.6, startDockedSize - dx));
      }
      return;
    }

    // Float resize — compute new geometry per direction
    let nx = startX,
      ny = startY,
      nw = startW,
      nh = startH;
    if (dir.includes("e")) nw = Math.max(MIN_W, startW + dx);
    if (dir.includes("s")) nh = Math.max(MIN_H, startH + dy);
    if (dir.includes("w")) {
      nw = Math.max(MIN_W, startW - dx);
      nx = startX + startW - nw;
    }
    if (dir.includes("n")) {
      nh = Math.max(MIN_H, startH - dy);
      ny = startY + startH - nh;
    }
    floatX.value = nx;
    floatY.value = ny;
    floatW.value = nw;
    floatH.value = nh;
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
  if (bootPhase.value === 2) inputRef.value?.focus();
};

// ─────────────────────────────────────────────
//  Computed panel styles
// ─────────────────────────────────────────────

const panelStyle = computed(() => {
  if (dockPosition.value === "float") {
    return {
      left: `${floatX.value}px`,
      top: `${floatY.value}px`,
      width: `${floatW.value}px`,
      height: `${floatH.value}px`,
      bottom: "auto",
      right: "auto",
    };
  }
  if (dockPosition.value === "bottom") {
    return {
      height: `${dockedSize.value}px`,
      width: "100%",
      bottom: "0",
      left: "0",
      right: "0",
      top: "auto",
    };
  }
  return {
    width: `${dockedSize.value}px`,
    height: "100%",
    right: "0",
    top: "0",
    bottom: "0",
    left: "auto",
  };
});

const titlebarHint = computed(() => {
  if (dockPosition.value === "bottom") return "⊡ bottom";
  if (dockPosition.value === "right") return "⊞ right";
  return "◈ float";
});

const dockCycleIcon = computed(() => {
  if (dockPosition.value === "bottom") return "⇥";
  if (dockPosition.value === "right") return "⊡";
  return "⇩";
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
  if (isGlitching.value) stopGlitch();
});
</script>

<template>
  <ClientOnly>
    <!-- Slash hint -->
    <Transition name="slash-hint">
      <div v-if="slashVisible && !isOpen" class="slash-hint" aria-hidden="true">
        {{ slashBuffer }}<span class="slash-cursor">▋</span>
      </div>
    </Transition>

    <!-- Panel -->
    <Transition
      :name="
        dockPosition === 'float' ? 'pop' : dockPosition === 'bottom' ? 'slide-up' : 'slide-right'
      "
    >
      <div
        v-if="isOpen"
        class="console-panel"
        :class="[`dock-${dockPosition}`, { 'is-dragging': isDragging, 'is-resizing': isResizing }]"
        :style="panelStyle"
        @click="focusInput"
      >
        <!-- ── Docked resize handle (single edge) ── -->
        <div
          v-if="dockPosition !== 'float'"
          class="resize-handle"
          :class="dockPosition === 'bottom' ? 'resize-bottom' : 'resize-right'"
          @mousedown="e => startResize(e, 'docked')"
          @touchstart.prevent="e => startResize(e, 'docked')"
        />

        <!-- ── Float resize handles (8 directions) ── -->
        <template v-if="dockPosition === 'float'">
          <div class="rh rh-n" @mousedown.stop="e => startResize(e, 'n')" />
          <div class="rh rh-s" @mousedown.stop="e => startResize(e, 's')" />
          <div class="rh rh-e" @mousedown.stop="e => startResize(e, 'e')" />
          <div class="rh rh-w" @mousedown.stop="e => startResize(e, 'w')" />
          <div class="rh rh-ne" @mousedown.stop="e => startResize(e, 'ne')" />
          <div class="rh rh-nw" @mousedown.stop="e => startResize(e, 'nw')" />
          <div class="rh rh-se" @mousedown.stop="e => startResize(e, 'se')" />
          <div class="rh rh-sw" @mousedown.stop="e => startResize(e, 'sw')" />
        </template>

        <!-- ── Titlebar ── -->
        <div
          class="console-titlebar"
          :class="{ draggable: dockPosition === 'float' }"
          @mousedown="startDrag"
        >
          <div class="titlebar-dots">
            <span class="dot dot-red" @click.stop="close" title="Close" />
            <!-- Yellow: cycle dock mode -->
            <span
              class="dot dot-yellow"
              @click.stop="cycleDock"
              title="Cycle dock (bottom → right → float)"
            />
            <!-- Green: pop out to float / back to docked -->
            <span class="dot dot-green" @click.stop="popOut" title="Float / dock" />
          </div>
          <span class="titlebar-title">
            stevanussatria.com — terminal
            <span class="titlebar-hint">{{ titlebarHint }}</span>
          </span>
          <div class="titlebar-actions">
            <button
              class="titlebar-btn"
              @click.stop="cycleDock"
              :title="`Cycle dock: ${dockPosition === 'bottom' ? 'bottom → right' : dockPosition === 'right' ? 'right → float' : 'float → bottom'}`"
            >
              {{ dockCycleIcon }}
            </button>
            <button class="titlebar-btn" @click.stop="close" title="Close (Esc)">✕</button>
          </div>
        </div>

        <!-- ── Scanlines ── -->
        <div class="scanlines" aria-hidden="true" />

        <!-- ── Output ── -->
        <div ref="outputRef" class="console-output">
          <div v-for="line in lines" :key="line.id" :class="['console-line', `line-${line.type}`]">
            {{ line.text }}
          </div>

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
          <div v-else-if="bootPhase === 1" class="boot-cursor">▋</div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap");

/* ── Slash hint ─────────────────────────────── */
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

/* ── Panel ──────────────────────────────────── */
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

.dock-float {
  border: 1px solid rgba(0, 194, 168, 0.3);
  border-radius: 10px;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(0, 102, 178, 0.12),
    0 0 60px rgba(0, 102, 178, 0.08);
}

.is-dragging {
  cursor: grabbing !important;
  user-select: none;
}

.is-resizing {
  user-select: none;
}

/* ── Transitions ────────────────────────────── */
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

.pop-enter-active {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.18s;
}

.pop-leave-active {
  transition:
    transform 0.15s ease,
    opacity 0.12s;
}

.pop-enter-from,
.pop-leave-to {
  transform: scale(0.94);
  opacity: 0;
}

/* ── Docked resize handle ───────────────────── */
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

/* ── Float resize handles (8 dirs) ─────────── */
/* Invisible grab zones along edges and corners  */
.rh {
  position: absolute;
  z-index: 20;
}

.rh-n {
  top: 0;
  left: 10px;
  right: 10px;
  height: 5px;
  cursor: ns-resize;
}

.rh-s {
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 5px;
  cursor: ns-resize;
}

.rh-e {
  right: 0;
  top: 10px;
  bottom: 10px;
  width: 5px;
  cursor: ew-resize;
}

.rh-w {
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 5px;
  cursor: ew-resize;
}

.rh-ne {
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  cursor: ne-resize;
}

.rh-nw {
  top: 0;
  left: 0;
  width: 14px;
  height: 14px;
  cursor: nw-resize;
}

.rh-se {
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  cursor: se-resize;
}

.rh-sw {
  bottom: 0;
  left: 0;
  width: 14px;
  height: 14px;
  cursor: sw-resize;
}

/* ── Titlebar ───────────────────────────────── */
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

.console-titlebar.draggable {
  cursor: grab;
}

.console-titlebar.draggable:active {
  cursor: grabbing;
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

/* ── Scanlines ──────────────────────────────── */
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

/* ── Output ─────────────────────────────────── */
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

/* ── Lines ──────────────────────────────────── */
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

/* ── Input row ──────────────────────────────── */
.console-input-row {
  display: flex;
  align-items: center;
  margin-top: 0.2rem;
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

.console-input::placeholder {
  color: rgba(255, 255, 255, 0.12);
}

/* ── Boot cursor ────────────────────────────── */
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
