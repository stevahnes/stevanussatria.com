<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { marked } from "marked";
import { useData } from "vitepress";

// --- Types ---
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

interface ChatActivationEvent extends CustomEvent {
  detail: {
    message: string;
  };
}

declare global {
  interface WindowEventMap {
    activateChat: ChatActivationEvent;
  }
}

// --- Constants ---
const API_BASE = "https://advocado-agent.vercel.app";
const INITIAL_GREETING = "Hi! What would you like to learn about Steve today?";

const PROMPT_SUGGESTIONS = [
  "Tell me about Steve's background",
  "What are Steve's top skills?",
  "Summarize Steve's work experience",
  "Show me Steve's recent projects",
  "How can I contact Steve?",
] as const;

// --- State ---
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const isClient = ref(false);
const userInput = ref("");
const isMiniChat = ref(false);
const isCompactMode = ref(true);
const isFullHeight = ref(false);
const copiedIndex = ref<number | null>(null);
const lastFailedMessage = ref<string | null>(null);

// --- DOM Refs ---
const inputRef = ref<HTMLTextAreaElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const suggestionRef = ref<HTMLDivElement | null>(null);

// --- Theme ---
const { isDark } = useData();
const clientSideTheme = ref(false);

const tc = (dark: string, light: string): string =>
  clientSideTheme.value && isDark.value ? dark : light;

const cssVars = computed(() => ({
  "--scrollbar-thumb": tc("#4a5568", "#cbd5e0"),
  "--scrollbar-thumb-hover": tc("#2d3748", "#a0aec0"),
  "--scrollbar-track": tc("#1a202c", "#edf2f7"),
  "--code-bg-color": tc("rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.05)"),
  "--link-color": tc("#90cdf4", "#3182ce"),
  "--blockquote-border-color": tc("#4a5568", "#cbd5e0"),
}));

// --- Mobile Detection ---
const isMobileDevice = (): boolean =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || "ontouchstart" in window;

// --- Utility Functions ---
const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const parseMarkdown = (content: string): string | Promise<string> => marked.parse(content);

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (!chatContainerRef.value) return;

  requestAnimationFrame(() => {
    if (!chatContainerRef.value) return;
    const isAtBottom =
      chatContainerRef.value.scrollHeight - chatContainerRef.value.scrollTop <=
      chatContainerRef.value.clientHeight + 50;

    if (!isAtBottom) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const resizeTextarea = (): void => {
  if (!inputRef.value) return;

  inputRef.value.style.height = "auto";

  const lineHeight = 20;
  const paddingVertical = 12;
  const maxLines = 3;
  const minHeight = lineHeight + paddingVertical;
  const maxHeight = lineHeight * maxLines + paddingVertical;

  const scrollHeight = inputRef.value.scrollHeight;
  const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));

  inputRef.value.style.height = `${newHeight}px`;
};

// --- Mini Chat Logic ---
const expandToFullMode = async (): Promise<void> => {
  isCompactMode.value = false;
  await nextTick();
  scrollToBottom();
};

const toggleMiniChat = (): void => {
  isMiniChat.value = !isMiniChat.value;
  localStorage.setItem("miniChatExpanded", isMiniChat.value.toString());
  if (isMiniChat.value) {
    nextTick(() => {
      if (!isMobileDevice()) {
        inputRef.value?.focus({ preventScroll: true });
      }
      if (!isCompactMode.value) scrollToBottom();
    });
  }
};

const toggleFullHeight = (): void => {
  isFullHeight.value = !isFullHeight.value;
  localStorage.setItem("chatFullHeight", isFullHeight.value.toString());
  nextTick(() => scrollToBottom());
};

const resetChat = (): void => {
  messages.value = [{ role: "assistant", content: INITIAL_GREETING, timestamp: Date.now() }];
  isCompactMode.value = true;
  isFullHeight.value = false;
  lastFailedMessage.value = null;
  sessionStorage.removeItem("chatMessages");
  sessionStorage.removeItem("chatCompactMode");
  localStorage.removeItem("chatFullHeight");
};

// --- Event Handlers ---
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (userInput.value.trim()) sendMessage();
  }
};

const handleGlobalKeydown = (e: KeyboardEvent): void => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ".") {
    e.preventDefault();
    toggleMiniChat();
  }
};

// --- Copy ---
const copyMessage = async (content: string, index: number): Promise<void> => {
  try {
    await navigator.clipboard.writeText(content);
    copiedIndex.value = index;
    setTimeout(() => {
      copiedIndex.value = null;
    }, 2000);
  } catch {
    /* clipboard API may fail in some contexts */
  }
};

// --- Retry ---
const retryLastMessage = (): void => {
  if (!lastFailedMessage.value) return;
  messages.value.pop();
  messages.value.pop();
  userInput.value = lastFailedMessage.value;
  lastFailedMessage.value = null;
  sendMessage();
};

// --- Message Handling ---
const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim()) return;

  const userText = userInput.value;
  lastFailedMessage.value = null;

  const isFirstMessage =
    messages.value.length <= 1 &&
    messages.value[0]?.role === "assistant" &&
    messages.value[0]?.content.includes(INITIAL_GREETING);

  messages.value.push({
    role: "user",
    content: userInput.value,
    timestamp: Date.now(),
  });

  if (isFirstMessage) {
    await expandToFullMode();
  }

  let currentAssistantContent = "";
  let assistantMessageAdded = false;
  loading.value = true;
  userInput.value = "";

  if (inputRef.value) {
    inputRef.value.style.height = "auto";
    resizeTextarea();
  }

  try {
    const requestBody = {
      messages: messages.value
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content })),
    };

    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("0:")) continue;
        try {
          const text = JSON.parse(line.slice(2));
          if (!assistantMessageAdded) {
            messages.value.push({ role: "assistant", content: "", timestamp: Date.now() });
            assistantMessageAdded = true;
          }
          currentAssistantContent += text;
          messages.value[messages.value.length - 1].content = currentAssistantContent;
          messages.value = [...messages.value];
          await scrollToBottom();
        } catch {}
      }
    }
  } catch (error) {
    console.error("Error during streaming:", error);
    lastFailedMessage.value = userText;
    if (!assistantMessageAdded) {
      messages.value.push({
        role: "assistant",
        content: "Something went wrong. Please try again or [read about Steve here](/).",
        timestamp: Date.now(),
      });
    }
  } finally {
    loading.value = false;
    await nextTick();
    if (!isMobileDevice()) {
      inputRef.value?.focus({ preventScroll: true });
    }
    await scrollToBottom();
  }
};

const handleChatActivation = (event: ChatActivationEvent): void => {
  const { message } = event.detail;

  if (!isMiniChat.value) {
    isMiniChat.value = true;
    if (isClient.value) {
      localStorage.setItem("miniChatExpanded", "true");
    }
  }

  if (message && typeof message === "string") {
    userInput.value = message;
    nextTick(() => {
      resizeTextarea();
      if (!isMobileDevice()) {
        inputRef.value?.focus({ preventScroll: true });
      }
    });
  }
};

const setSuggestion = (suggestion: string, event?: MouseEvent | PointerEvent): void => {
  userInput.value = suggestion;

  if (event?.currentTarget) {
    (event.currentTarget as HTMLElement).scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  nextTick(() => {
    resizeTextarea();
    if (!isMobileDevice()) {
      inputRef.value?.focus({ preventScroll: true });
    }
  });
};

// --- Lifecycle ---
onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;

  const savedMessages = sessionStorage.getItem("chatMessages");
  if (savedMessages) {
    try {
      const parsed = JSON.parse(savedMessages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed;
        isCompactMode.value = sessionStorage.getItem("chatCompactMode") === "false" ? false : true;
      }
    } catch {
      /* fall through to default */
    }
  }
  if (messages.value.length === 0) {
    messages.value = [{ role: "assistant", content: INITIAL_GREETING, timestamp: Date.now() }];
  }

  isMiniChat.value = false;
  if (localStorage.getItem("miniChatExpanded") === "true") {
    isMiniChat.value = true;
  }
  if (localStorage.getItem("chatFullHeight") === "true") {
    isFullHeight.value = true;
  }

  window.addEventListener("activateChat", handleChatActivation);
  window.addEventListener("keydown", handleGlobalKeydown);

  await nextTick();
  scrollToBottom();
  if (inputRef.value) {
    resizeTextarea();
    if (!isMobileDevice()) {
      inputRef.value.focus({ preventScroll: true });
    }
  }

  if (suggestionRef.value) {
    suggestionRef.value.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          suggestionRef.value!.scrollLeft += e.deltaY;
        }
      },
      { passive: false },
    );
  }
});

onUnmounted(() => {
  window.removeEventListener("activateChat", handleChatActivation);
  window.removeEventListener("keydown", handleGlobalKeydown);
});

// --- Watchers ---
watch(userInput, () => nextTick(resizeTextarea));
watch(
  messages,
  newMessages => {
    scrollToBottom();
    if (isClient.value && newMessages.length > 0) {
      sessionStorage.setItem("chatMessages", JSON.stringify(newMessages));
      sessionStorage.setItem("chatCompactMode", isCompactMode.value.toString());
    }
  },
  { deep: true },
);
</script>

<template>
  <div v-if="isClient" class="chat-position !fixed !bottom-4 !z-50">
    <!-- Chat Toggle Button — glass FAB matching shader picker -->
    <button
      v-if="!isMiniChat"
      class="chat-fab"
      aria-label="Open chat with Advocado"
      @click="toggleMiniChat"
    >
      <img src="/advocado.webp" alt="Advocado" class="!w-8 !h-8 !rounded-full" />
    </button>

    <!-- Mini Chat Window -->
    <div
      v-else
      :style="cssVars"
      role="dialog"
      aria-label="Chat with Advocado"
      :class="[
        '!rounded-2xl !transition-all',
        tc(
          '!bg-gray-900/60 !border !border-white/10 !shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          '!bg-white/60 !border !border-white/20 !shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
        ),
        '!backdrop-blur-[20px]',
        '!flex !flex-col',
        isCompactMode
          ? '!h-auto !w-[calc(100vw-2rem)] sm:!w-[400px] !max-w-[400px]'
          : isFullHeight
            ? '!h-[calc(100vh-6rem)] !w-[calc(100vw-2rem)] sm:!w-[560px] !max-w-[560px]'
            : '!max-h-[32rem] !w-[calc(100vw-2rem)] sm:!w-[400px] !max-w-[400px]',
      ]"
    >
      <Transition name="chat-mode" mode="out-in">
        <!-- Compact Mode -->
        <div v-if="isCompactMode" key="compact" class="!relative !p-6 !pt-8">
          <!-- Close button -->
          <button
            :class="[
              '!absolute !top-3 !right-3 !p-1.5 !rounded-full !transition-colors',
              tc(
                '!text-gray-400 hover:!text-gray-200 hover:!bg-gray-700',
                '!text-gray-500 hover:!text-gray-700 hover:!bg-gray-100',
              ),
            ]"
            aria-label="Close chat"
            @click="toggleMiniChat"
          >
            <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Welcome Header -->
          <div class="!text-center !mb-6">
            <div class="!flex !items-center !justify-center !mb-3">
              <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
              <h3 :class="['!text-xl !font-bold', tc('!text-white', '!text-gray-900')]">
                Chat with Advocado 🥑
              </h3>
            </div>
            <p :class="['!text-base !leading-relaxed', tc('!text-gray-300', '!text-gray-600')]">
              {{ messages[0]?.content || INITIAL_GREETING }}
            </p>
          </div>

          <!-- Prompt Suggestions -->
          <div class="!mb-6">
            <div class="!flex !flex-col !gap-3">
              <button
                v-for="suggestion in PROMPT_SUGGESTIONS"
                :key="suggestion"
                type="button"
                :class="[
                  '!w-full !px-4 !py-3 !rounded-xl !text-base !font-medium !transition-all',
                  '!border !text-left !shadow-sm',
                  tc(
                    '!bg-gray-800 !text-gray-200 !border-gray-600 hover:!bg-gray-700',
                    '!bg-gray-50 !text-gray-700 !border-gray-200 hover:!bg-gray-100',
                  ),
                ]"
                @click="setSuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Input Form -->
          <form class="!flex !gap-2" @submit.prevent="sendMessage">
            <textarea
              ref="inputRef"
              v-model="userInput"
              placeholder="Ask something..."
              aria-label="Type your message"
              :class="[
                '!flex-1 !rounded-lg !p-2 !text-base !resize-none !leading-5 !overflow-y-auto',
                '!border-0 !outline-none !focus:ring-0',
                tc(
                  '!bg-gray-800 !text-gray-100 !placeholder-gray-400',
                  '!bg-gray-100 !text-gray-800 !placeholder-gray-500',
                ),
              ]"
              :disabled="loading"
              rows="1"
              @keydown="handleKeyDown"
            ></textarea>
            <button
              type="submit"
              aria-label="Send message"
              :class="[
                'send-btn',
                userInput.trim() && !loading ? 'send-btn--active' : 'send-btn--disabled',
                !loading || !userInput.trim() ? '' : '',
              ]"
              :disabled="loading || !userInput.trim()"
            >
              <svg
                v-if="!loading"
                xmlns="http://www.w3.org/2000/svg"
                class="!h-4 !w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <div v-else class="!h-4 !w-4 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"></div>
            </button>
          </form>
        </div>

        <!-- Expanded Mode -->
        <div v-else key="expanded" class="!flex !flex-col !h-full">
          <!-- Header -->
          <div
            :class="[
              '!p-3 !flex !items-center !justify-between !border-b',
              tc('!border-gray-700', '!border-gray-200'),
            ]"
          >
            <div class="!flex !items-center !gap-2">
              <div class="!h-2 !w-2 !rounded-full !bg-green-500"></div>
              <h3 :class="['!text-base !font-medium', tc('!text-gray-100', '!text-gray-800')]">
                Chat with Advocado 🥑
              </h3>
            </div>
            <div class="!flex !items-center !gap-1">
              <!-- New Chat -->
              <button
                :class="[
                  '!p-1 !rounded !transition-colors',
                  tc('!text-gray-300 hover:!bg-gray-800', '!text-gray-600 hover:!bg-gray-100'),
                ]"
                aria-label="New conversation"
                @click="resetChat"
              >
                <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.356v4.992" />
                </svg>
              </button>
              <!-- Full Screen Toggle -->
              <button
                :class="[
                  '!p-1 !rounded !transition-colors',
                  tc('!text-gray-300 hover:!bg-gray-800', '!text-gray-600 hover:!bg-gray-100'),
                ]"
                aria-label="Toggle full screen"
                @click="toggleFullHeight"
              >
                <svg v-if="!isFullHeight" class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                </svg>
                <svg v-else class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5m-4.5 0v4.5m0-4.5l5.25 5.25" />
                </svg>
              </button>
              <!-- Close -->
              <button
                :class="[
                  '!p-1 !rounded !transition-colors',
                  tc('!text-gray-300 hover:!bg-gray-800', '!text-gray-600 hover:!bg-gray-100'),
                ]"
                aria-label="Close chat"
                @click="toggleMiniChat"
              >
                <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div
            ref="chatContainerRef"
            role="log"
            aria-live="polite"
            :class="['!flex-1 !overflow-y-auto !p-3 !space-y-3', isFullHeight ? '' : '!max-h-80']"
          >
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="!flex !w-full"
              :class="[msg.role === 'user' ? '!justify-end' : '!justify-start']"
            >
              <div
                v-if="msg.content.trim()"
                class="group"
                :class="[
                  '!rounded-lg !px-3 !py-2 !max-w-[85%] !text-base !shadow-md',
                  msg.role === 'user'
                    ? 'user-bubble'
                    : tc(
                        '!bg-white/8 !text-gray-100 !border !border-white/10 !backdrop-blur-md',
                        '!bg-white/60 !text-gray-800 !border !border-white/20 !backdrop-blur-md',
                      ),
                ]"
              >
                <div class="!flex !justify-between !items-center !mb-1">
                  <span
                    :class="[
                      '!text-sm',
                      msg.role === 'user'
                        ? '!text-blue-100'
                        : tc('!text-gray-400', '!text-gray-500'),
                    ]"
                  >
                    {{ msg.role === "user" ? "You" : "Advocado" }}
                  </span>
                  <div class="!flex !items-center !gap-1">
                    <span
                      v-if="msg.timestamp"
                      :class="[
                        '!text-sm !ml-4',
                        msg.role === 'user'
                          ? '!text-blue-100'
                          : tc('!text-gray-400', '!text-gray-500'),
                      ]"
                    >
                      {{ formatTime(msg.timestamp) }}
                    </span>
                    <button
                      v-if="msg.role === 'assistant'"
                      class="!opacity-0 group-hover:!opacity-100 !transition-opacity !p-0.5 !rounded"
                      :class="tc('hover:!bg-gray-700', 'hover:!bg-gray-100')"
                      :aria-label="copiedIndex === index ? 'Copied' : 'Copy message'"
                      @click="copyMessage(msg.content, index)"
                    >
                      <svg v-if="copiedIndex !== index" class="!w-3.5 !h-3.5" :class="tc('!text-gray-400', '!text-gray-500')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <svg v-else class="!w-3.5 !h-3.5 !text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="markdown-content" v-html="parseMarkdown(msg.content)"></div>
              </div>
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="!flex !justify-start !w-full">
              <div
                :class="[
                  '!rounded-lg !px-3 !py-2 !max-w-[85%] !text-base !shadow-md',
                  tc(
                    '!bg-white/8 !text-gray-300 !border !border-white/10 !backdrop-blur-md',
                    '!bg-white/60 !text-gray-600 !border !border-white/20 !backdrop-blur-md',
                  ),
                ]"
              >
                <div class="!flex !justify-between !items-center !mb-1">
                  <span :class="['!text-sm', tc('!text-gray-400', '!text-gray-500')]">Advocado</span>
                  <span :class="['!text-sm !ml-4', tc('!text-gray-400', '!text-gray-500')]">{{ formatTime(Date.now()) }}</span>
                </div>
                <div class="!flex !items-center">
                  <span
                    v-for="(_, i) in 3"
                    :key="i"
                    :class="['!inline-block !h-1.5 !w-1.5 !rounded-full !animate-pulse', tc('!bg-gray-400', '!bg-gray-300')]"
                    :style="{ marginLeft: i > 0 ? '0.25rem' : 0, marginRight: i < 2 ? '0.25rem' : 0, animationDelay: `${i * 0.2}s` }"
                  ></span>
                </div>
              </div>
            </div>

            <!-- Retry Button -->
            <div v-if="lastFailedMessage && !loading" class="!flex !justify-center !w-full">
              <button class="retry-btn" @click="retryLastMessage">Retry</button>
            </div>
          </div>

          <!-- Suggestion Carousel -->
          <div
            ref="suggestionRef"
            :class="[
              '!px-3 !py-2 !border-t !overflow-x-auto !flex !gap-2 !flex-nowrap scrollbar-hide',
              tc('!border-gray-700', '!border-gray-200'),
            ]"
          >
            <button
              v-for="suggestion in PROMPT_SUGGESTIONS"
              :key="suggestion"
              type="button"
              :class="[
                '!whitespace-nowrap !px-3 !py-1.5 !rounded-full !text-sm !font-medium !transition-colors !shrink-0 !border touch-pan-x',
                tc(
                  '!bg-gray-800 !text-gray-300 !border-gray-600 hover:!bg-gray-700',
                  '!bg-gray-50 !text-gray-600 !border-gray-200 hover:!bg-gray-100',
                ),
              ]"
              :disabled="loading"
              @click="setSuggestion(suggestion, $event)"
            >
              {{ suggestion }}
            </button>
          </div>

          <!-- Input Area -->
          <div :class="['!p-3 !border-t', tc('!border-gray-700', '!border-gray-200')]">
            <form class="!flex !gap-2" @submit.prevent="sendMessage">
              <textarea
                ref="inputRef"
                v-model="userInput"
                placeholder="AMA about Steve! 🎤"
                aria-label="Type your message"
                :class="[
                  '!flex-1 !rounded-lg !p-2 !text-base !resize-none !leading-5 !overflow-y-auto',
                  '!border-0 !outline-none !focus:ring-0',
                  tc(
                    '!bg-gray-800 !text-gray-100 !placeholder-gray-400',
                    '!bg-gray-100 !text-gray-800 !placeholder-gray-500',
                  ),
                ]"
                :disabled="loading"
                rows="1"
                @keydown="handleKeyDown"
              ></textarea>
              <button
                type="submit"
                aria-label="Send message"
                :class="[
                  'send-btn',
                  userInput.trim() && !loading ? 'send-btn--active' : 'send-btn--disabled',
                ]"
                :disabled="loading || !userInput.trim()"
              >
                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="!h-4 !w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <div v-else class="!h-4 !w-4 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"></div>
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.chat-position {
  right: max(1rem, calc(50vw - 720px));
}

/* ── FAB — glass circle matching shader picker aesthetic ── */
.chat-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.chat-fab:hover {
  background: rgba(0, 102, 178, 0.25);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 0 4px 24px rgba(0, 102, 178, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

:root:not(.dark) .chat-fab {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.70);
  box-shadow: 0 2px 16px rgba(0, 102, 178, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

:root:not(.dark) .chat-fab:hover {
  background: rgba(0, 102, 178, 0.10);
  border-color: rgba(0, 102, 178, 0.25);
  box-shadow: 0 4px 20px rgba(0, 102, 178, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

/* ── Send button ── */
.send-btn {
  border-radius: 8px;
  padding: 0 12px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  font-family: inherit;
  cursor: pointer;
}

.send-btn--active {
  background: rgba(0, 102, 178, 0.75);
  border-color: rgba(255, 255, 255, 0.18);
  color: white;
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.send-btn--active:hover {
  background: rgba(0, 102, 178, 0.90);
  box-shadow: 0 4px 16px rgba(0, 102, 178, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

:root:not(.dark) .send-btn--active {
  background: rgba(0, 102, 178, 0.85);
  border-color: rgba(0, 102, 178, 0.3);
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.send-btn--disabled {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.30);
  cursor: not-allowed;
}

:root:not(.dark) .send-btn--disabled {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.25);
}

/* ── User message bubble ── */
.user-bubble {
  background: rgba(0, 102, 178, 0.70);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: white;
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.25);
}

:root:not(.dark) .user-bubble {
  background: rgba(0, 102, 178, 0.82);
  border-color: rgba(0, 102, 178, 0.25);
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.20);
}

/* ── Retry button ── */
.retry-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 102, 178, 0.70);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  color: white;
  box-shadow: 0 2px 12px rgba(0, 102, 178, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.10);
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}

.retry-btn:hover {
  background: rgba(0, 102, 178, 0.88);
  box-shadow: 0 4px 16px rgba(0, 102, 178, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

/* ── Scrollbar ── */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.chat-mode-enter-active,
.chat-mode-leave-active { transition: opacity 0.15s ease; }
.chat-mode-enter-from,
.chat-mode-leave-to { opacity: 0; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
::-webkit-scrollbar-track { background: var(--scrollbar-track); }

:deep(.markdown-content) { line-height: 1.4 !important; }
:deep(.markdown-content p),
:deep(.markdown-content ul),
:deep(.markdown-content ol),
:deep(.markdown-content pre),
:deep(.markdown-content blockquote) { margin: 0 !important; padding: 0 !important; }
:deep(.markdown-content > * + *) { margin-top: 0.4em !important; }
:deep(.markdown-content p + p) { margin-top: 0.4em !important; }
:deep(.markdown-content li) { margin: 0 !important; padding: 0 !important; }
:deep(.markdown-content li + li) { margin-top: 0.15em !important; }
:deep(.markdown-content li p) { margin: 0 !important; padding: 0 !important; }
:deep(.markdown-content ul),
:deep(.markdown-content ol) { margin-left: 1rem !important; padding: 0 !important; }
:deep(.markdown-content ul) { list-style-type: disc !important; }
:deep(.markdown-content ol) { list-style-type: decimal !important; }
:deep(.markdown-content strong) { font-weight: bold !important; }
:deep(.markdown-content em) { font-style: italic !important; }
:deep(.markdown-content code) {
  font-family: monospace !important;
  background-color: var(--code-bg-color) !important;
  padding: 0.1rem 0.3rem !important;
  border-radius: 0.25rem !important;
}
:deep(.markdown-content pre code) {
  display: block !important;
  padding: 0.75rem !important;
  margin-bottom: 0.5rem !important;
  overflow-x: auto !important;
}
:deep(.markdown-content a) { color: var(--link-color) !important; text-decoration: underline !important; }
:deep(.markdown-content blockquote) {
  border-left: 3px solid var(--blockquote-border-color) !important;
  padding-left: 1rem !important;
  font-style: italic !important;
  margin: 0 !important;
}
</style>