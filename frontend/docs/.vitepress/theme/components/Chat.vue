<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { marked } from "marked";
import { useData, useRoute } from "vitepress";

// --- Types ---
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

// --- Constants ---
const API_BASE = "https://advocado-agent.vercel.app";

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
const isInitialLoading = ref(false);
const isClient = ref(false);
const isEndingChat = ref(false);
const showFeedbackModal = ref(false);
const feedback = ref<"good" | "bad" | null>(null);
const threadId = ref<string | null>(null);
const userInput = ref("");
const isMobile = ref(false);
const chatMountPoint = ref(false);

// --- Display Mode ---
const route = useRoute();
const displayMode = computed(() => {
  return route.path === "/" || route.path === "/index" ? "full" : "mini";
});

// --- Mini Chat Specific State ---
const isMiniChat = ref(false);
const isCompactMode = ref(true);

// --- Full Chat Specific State ---
const chatHeight = ref(500);
const isDragging = ref(false);
const isFirstMessageSent = ref(false);

// --- DOM Refs ---
const inputRef = ref<HTMLTextAreaElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const chatWindowRef = ref<HTMLDivElement | null>(null);
const promptBarRef = ref<HTMLDivElement | null>(null);
const showLeftScroll = ref(false);
const showRightScroll = ref(false);

// --- Theme ---
const { isDark } = useData();
const clientSideTheme = ref(false);

const cssVars = computed(() => ({
  "--scrollbar-thumb": clientSideTheme.value && isDark.value ? "#4a5568" : "#cbd5e0",
  "--scrollbar-thumb-hover": clientSideTheme.value && isDark.value ? "#2d3748" : "#a0aec0",
  "--scrollbar-track": clientSideTheme.value && isDark.value ? "#1a202c" : "#edf2f7",
  "--code-bg-color":
    clientSideTheme.value && isDark.value ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
  "--link-color": clientSideTheme.value && isDark.value ? "#90cdf4" : "#3182ce",
  "--blockquote-border-color": clientSideTheme.value && isDark.value ? "#4a5568" : "#cbd5e0",
}));

// --- Computed ---
const hasOngoingThread = computed(() => !!threadId.value);

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
  const newHeight = Math.min(inputRef.value.scrollHeight, displayMode.value === "mini" ? 100 : 200);
  inputRef.value.style.height = `${newHeight}px`;
};

const checkIfMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

// --- Mini Chat Expand/Collapse Logic ---
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
      inputRef.value?.focus();
      if (!isCompactMode.value) scrollToBottom();
    });
  }
};

// --- Full Chat Height Management ---
const setFullHeightAndScroll = async (): Promise<void> => {
  if (!isClient.value || !chatWindowRef.value || displayMode.value !== "full") return;

  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  chatHeight.value = isMobile.value ? viewportHeight - 20 : viewportHeight;
  localStorage.setItem("chatHeight", chatHeight.value.toString());

  if (isMobile.value) {
    requestAnimationFrame(() => {
      if (!chatWindowRef.value) return;
      const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
      setTimeout(scrollToBottom, 150);
    });
  } else {
    await nextTick();
    if (!chatWindowRef.value) return;
    const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }
};

// --- Resize Handlers for Full Chat ---
const resizeState = ref({ startY: 0, startHeight: 0 });

const startResize = (e: MouseEvent | TouchEvent): void => {
  if (displayMode.value !== "full") return;
  e.preventDefault();
  isDragging.value = true;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  resizeState.value = { startY: clientY, startHeight: chatHeight.value };

  if ("touches" in e) {
    document.addEventListener("touchmove", handleTouchResize, { passive: false });
    document.addEventListener("touchend", stopResize);
  } else {
    document.addEventListener("mousemove", handleMouseResize);
    document.addEventListener("mouseup", stopResize);
  }
};

const handleMouseResize = (e: MouseEvent): void => {
  if (!isDragging.value) return;
  const deltaY = e.clientY - resizeState.value.startY;
  chatHeight.value = Math.max(200, resizeState.value.startHeight + deltaY);
};

const handleTouchResize = (e: TouchEvent): void => {
  if (!isDragging.value) return;
  e.preventDefault();
  const deltaY = e.touches[0].clientY - resizeState.value.startY;
  chatHeight.value = Math.max(200, resizeState.value.startHeight + deltaY);
};

const stopResize = (): void => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleTouchResize);
  document.removeEventListener("touchend", stopResize);
  if (isClient.value) {
    localStorage.setItem("chatHeight", chatHeight.value.toString());
  }
};

// --- Prompt Bar Scroll ---
const updatePromptScrollButtons = (): void => {
  const el = promptBarRef.value;
  if (!el) return;
  showLeftScroll.value = el.scrollLeft > 0;
  showRightScroll.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

// --- Event Handlers ---
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (userInput.value.trim()) sendMessage();
  }
};

// --- VitePress-specific Mount Point Management ---
let mountPointObserver: MutationObserver | null = null;

const observeMountPoint = (): void => {
  if (typeof window === "undefined" || displayMode.value !== "full") return;

  // Clean up existing observer
  if (mountPointObserver) {
    mountPointObserver.disconnect();
    mountPointObserver = null;
  }

  const checkMountPoint = () => {
    const element = document.getElementById("chat-container");
    const newValue = !!element;

    // Only update if value changed to prevent unnecessary re-renders
    if (chatMountPoint.value !== newValue) {
      chatMountPoint.value = newValue;
    }
  };

  // Initial check
  checkMountPoint();

  // Set up observer for DOM changes
  try {
    mountPointObserver = new MutationObserver(() => {
      checkMountPoint();
    });

    // Try to target .vp-doc first, fallback to document.body
    const targetElement = document.querySelector(".vp-doc") || document.body;
    mountPointObserver.observe(targetElement, {
      childList: true,
      subtree: false,
    });
  } catch (error) {
    console.warn("MutationObserver not supported, using fallback");
    // Fallback: periodic check every 500ms
    const interval = setInterval(() => {
      if (displayMode.value !== "full") {
        clearInterval(interval);
        return;
      }
      checkMountPoint();
    }, 500);
  }
};

const stopObservingMountPoint = (): void => {
  if (mountPointObserver) {
    mountPointObserver.disconnect();
    mountPointObserver = null;
  }
  chatMountPoint.value = false;
};

// --- Fetch Messages from Backend ---
const fetchThreadMessages = async (): Promise<void> => {
  if (!threadId.value) return;

  isInitialLoading.value = true;
  try {
    const response = await fetch(`${API_BASE}/thread/listMessages?threadId=${threadId.value}`);

    if (response.ok) {
      const messagesData = await response.json();
      if (messagesData && Array.isArray(messagesData)) {
        messages.value = messagesData.map((msg: any) => ({
          role: msg.role,
          content: msg.content || "",
          timestamp: Date.now(),
        }));
        isCompactMode.value = false;
        isFirstMessageSent.value = true;
      } else {
        throw new Error("Invalid messages data");
      }
    } else {
      throw new Error("Failed to fetch messages");
    }
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    // Clear invalid thread
    localStorage.removeItem("threadId");
    threadId.value = null;
    messages.value = [
      {
        role: "assistant",
        content: "Hi! What would you like to learn about Steve today?",
        timestamp: Date.now(),
      },
    ];
  } finally {
    isInitialLoading.value = false;
    await nextTick();
    if (displayMode.value === "mini" && isMiniChat.value && !isCompactMode.value) {
      scrollToBottom();
    } else if (displayMode.value === "full") {
      scrollToBottom();
    }
  }
};

// --- Message Handling ---
const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim()) return;

  const isFirstMessage =
    messages.value.length <= 1 &&
    messages.value[0]?.role === "assistant" &&
    messages.value[0]?.content.includes("Hi! What would you like to learn about Steve today?");

  messages.value.push({
    role: "user",
    content: userInput.value,
    timestamp: Date.now(),
  });

  // Handle first message UI changes
  if (isFirstMessage) {
    isFirstMessageSent.value = true;
    if (displayMode.value === "mini") {
      await expandToFullMode();
    } else if (displayMode.value === "full" && !isFirstMessageSent.value) {
      setTimeout(async () => {
        await setFullHeightAndScroll();
        if (isMobile.value) {
          window.addEventListener(
            "resize",
            function onResize() {
              scrollToBottom();
              window.removeEventListener("resize", onResize);
            },
            { once: true },
          );
        }
      }, 50);
    }
  }

  let currentAssistantContent = "";
  let assistantMessageAdded = false;
  loading.value = true;

  const originalInput = userInput.value;
  userInput.value = "";

  try {
    const requestBody: any = {
      stream: true,
      rawResponse: true,
      messages: [{ role: "user", content: originalInput }],
    };

    if (threadId.value) requestBody.threadId = threadId.value;

    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
    if (!response.body) throw new Error("No response body");

    const threadIdHeader = response.headers.get("lb-thread-id");
    if (threadIdHeader && isClient.value) {
      localStorage.setItem("threadId", threadIdHeader);
      threadId.value = threadIdHeader;
    }

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
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const delta = parsed.choices[0]?.delta;
          if (delta?.content) {
            if (!assistantMessageAdded) {
              messages.value.push({ role: "assistant", content: "", timestamp: Date.now() });
              assistantMessageAdded = true;
            }
            currentAssistantContent += delta.content;
            messages.value[messages.value.length - 1].content = currentAssistantContent;
            messages.value = [...messages.value];
            await scrollToBottom();
          }
        } catch (error) {
          console.error("Error parsing line:", line, error);
        }
      }
    }
  } catch (error) {
    console.error("Error during streaming:", error);
    if (!assistantMessageAdded) {
      messages.value.push({
        role: "assistant",
        content: "Something went wrong. Please try again or [read about Steve here](/about).",
        timestamp: Date.now(),
      });
    }
  } finally {
    loading.value = false;
    if (inputRef.value) inputRef.value.style.height = "auto";
    await nextTick();
    if (inputRef.value) inputRef.value.focus();
    await scrollToBottom();
  }
};

// --- End Chat & Feedback ---
const endChat = (): void => {
  if (isEndingChat.value || showFeedbackModal.value || !threadId.value) return;
  showFeedbackModal.value = true;
  feedback.value = null;
};

const submitFeedback = async (): Promise<void> => {
  if (!feedback.value || isEndingChat.value || !threadId.value) return;

  isEndingChat.value = true;
  try {
    const response = await fetch(`${API_BASE}/thread/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: threadId.value, feedback: feedback.value }),
    });

    if (!response.ok) throw new Error("Failed to end chat");

    // Clear session
    localStorage.removeItem("threadId");
    localStorage.removeItem("miniChatExpanded");
    threadId.value = null;

    // Reset to initial state
    messages.value = [
      {
        role: "assistant",
        content: "Hi! What would you like to learn about Steve today?",
        timestamp: Date.now(),
      },
    ];

    // Reset UI states
    isCompactMode.value = true;
    isFirstMessageSent.value = false;
  } catch (error) {
    console.error("Error ending chat:", error);
    messages.value.push({
      role: "assistant",
      content: "Failed to end chat session. Please try again.",
      timestamp: Date.now(),
    });
  } finally {
    isEndingChat.value = false;
    showFeedbackModal.value = false;
    feedback.value = null;
  }
};

const closeFeedbackModal = (): void => {
  showFeedbackModal.value = false;
  feedback.value = null;
};

const setSuggestion = (suggestion: string): void => {
  userInput.value = suggestion;
  inputRef.value?.focus();
};

// --- Lifecycle ---
onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;
  isMobile.value = checkIfMobile();

  // Load threadId
  threadId.value = localStorage.getItem("threadId");

  // Initialize with default message
  messages.value = [
    {
      role: "assistant",
      content: "Hi! What would you like to learn about Steve today?",
      timestamp: Date.now(),
    },
  ];

  // Fetch messages if thread exists
  if (threadId.value) {
    await fetchThreadMessages();
  }

  // Handle mini chat open state
  if (displayMode.value === "mini") {
    isMiniChat.value = false;
    isCompactMode.value = true;
    const lastMiniChatExpanded = localStorage.getItem("miniChatExpanded") || "true";
    if (lastMiniChatExpanded === "true") {
      isMiniChat.value = true;
    }
    if (isFirstMessageSent.value) {
      isCompactMode.value = false;
    }
  }

  // Handle full chat height
  if (displayMode.value === "full") {
    if (threadId.value) {
      const savedHeight = localStorage.getItem("chatHeight");
      if (savedHeight) {
        chatHeight.value = parseInt(savedHeight, 10);
      }
    } else {
      chatHeight.value = 500;
      localStorage.removeItem("chatHeight");
    }
  }

  // Start observing mount point for full mode
  if (displayMode.value === "full") {
    nextTick(() => observeMountPoint());
  }

  // Setup event listeners
  window.addEventListener("resize", () => {
    isMobile.value = checkIfMobile();
    if (isFirstMessageSent.value && displayMode.value === "full") {
      chatHeight.value = window.innerHeight;
      localStorage.setItem("chatHeight", chatHeight.value.toString());
    }
    updatePromptScrollButtons();
  });

  await nextTick();
  scrollToBottom();
  inputRef.value?.focus();

  if (displayMode.value === "full") {
    updatePromptScrollButtons();
    promptBarRef.value?.addEventListener("scroll", updatePromptScrollButtons);
  }
});

onUnmounted(() => {
  promptBarRef.value?.removeEventListener("scroll", updatePromptScrollButtons);
  stopObservingMountPoint();
});

// --- Watchers ---
watch(userInput, () => nextTick(resizeTextarea));
watch(messages, () => scrollToBottom(), { deep: true });

watch(
  displayMode,
  newMode => {
    if (newMode === "full") {
      nextTick(() => observeMountPoint());
      if (isFirstMessageSent.value) {
        nextTick(() => setFullHeightAndScroll());
      }
    } else if (newMode === "mini") {
      stopObservingMountPoint();
      const lastMiniChatExpanded = localStorage.getItem("miniChatExpanded") || "true";
      if (lastMiniChatExpanded === "true") {
        isMiniChat.value = true;
      }
      if (isFirstMessageSent.value) {
        isCompactMode.value = false;
      }
    }
  },
  { immediate: false },
);

// Watch route changes for VitePress navigation
watch(
  () => route.path,
  () => {
    if (displayMode.value === "full") {
      nextTick(() => observeMountPoint());
    } else {
      stopObservingMountPoint();
    }
  },
  { immediate: false },
);
</script>

<template>
  <!-- Full Chat Mode (Homepage) - Only render if mount point exists -->
  <Teleport to="#chat-container" v-if="isClient && displayMode === 'full' && chatMountPoint">
    <div
      ref="chatWindowRef"
      :style="{ height: `${chatHeight}px`, ...cssVars }"
      :class="[
        '!relative !flex !w-full !flex-col !rounded-lg !p-4 !shadow-lg',
        clientSideTheme && isDark
          ? '!border !border-gray-700 !bg-gray-900'
          : '!border !border-gray-200 !bg-gray-50',
      ]"
    >
      <!-- Loading Overlay -->
      <div v-if="isInitialLoading" class="chat-loading-overlay">
        <div class="chat-loading-content">
          <div
            class="!h-8 !w-8 !border-4 !border-indigo-600 !border-t-transparent !rounded-full !animate-spin"
          ></div>
          <p :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'">
            Loading conversation...
          </p>
        </div>
      </div>

      <!-- Header -->
      <div
        :class="[
          '!mb-4 !pb-3 !flex !items-center !justify-between',
          clientSideTheme && isDark ? '!border-b !border-gray-700' : '!border-b !border-gray-200',
        ]"
      >
        <div class="!flex !items-center">
          <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
          <h3
            :class="
              clientSideTheme && isDark
                ? '!text-gray-100 !font-medium'
                : '!text-gray-800 !font-medium'
            "
          >
            Chat with Advocado 🥑
          </h3>
        </div>
        <button
          v-if="hasOngoingThread"
          :disabled="isEndingChat || isInitialLoading"
          :class="[
            '!px-3 !py-1 !rounded-lg !text-sm !transition-colors',
            '!bg-indigo-600 !hover:bg-indigo-700 !text-white',
            (isEndingChat || isInitialLoading) && '!opacity-50 !cursor-not-allowed',
          ]"
          @click="endChat"
        >
          {{ isEndingChat ? "Ending..." : "End Chat" }}
        </button>
      </div>

      <!-- Messages Area -->
      <div ref="chatContainerRef" class="!flex-1 !overflow-auto !space-y-4 !flex !flex-col !px-1">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="!flex !w-full !mb-3"
          :class="[msg.role === 'user' ? '!justify-end' : '!justify-start']"
        >
          <div
            v-if="msg.content.trim()"
            :class="[
              '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
              msg.role === 'user'
                ? '!bg-indigo-600 !text-white'
                : clientSideTheme && isDark
                  ? '!bg-gray-800 !text-gray-100 !border !border-gray-700'
                  : '!bg-white !text-gray-800 !border !border-gray-200',
            ]"
          >
            <div class="!flex !justify-between !items-center !mb-1">
              <span
                :class="[
                  '!text-xs',
                  msg.role === 'user'
                    ? '!text-gray-200'
                    : clientSideTheme && isDark
                      ? '!text-gray-400'
                      : '!text-gray-500',
                ]"
              >
                {{ msg.role === "user" ? "You" : "Advocado" }}
              </span>
              <span
                v-if="msg.timestamp"
                :class="[
                  '!text-xs !ml-4',
                  msg.role === 'user'
                    ? '!text-gray-200'
                    : clientSideTheme && isDark
                      ? '!text-gray-400'
                      : '!text-gray-500',
                ]"
              >
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
            <div
              class="!whitespace-pre-wrap markdown-content"
              v-html="parseMarkdown(msg.content)"
            ></div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="loading" class="!flex !justify-start !w-full">
          <div
            :class="[
              '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
              clientSideTheme && isDark
                ? '!bg-gray-800 !text-gray-300 !border !border-gray-700'
                : '!bg-white !text-gray-600 !border !border-gray-200',
            ]"
          >
            <div class="!flex !justify-between !items-center !mb-1">
              <span
                :class="
                  clientSideTheme && isDark ? '!text-xs !text-gray-400' : '!text-xs !text-gray-500'
                "
              >
                Advocado
              </span>
              <span
                :class="
                  clientSideTheme && isDark
                    ? '!text-xs !text-gray-400 !ml-4'
                    : '!text-xs !text-gray-500 !ml-4'
                "
              >
                {{ formatTime(Date.now()) }}
              </span>
            </div>
            <div class="!flex !items-center">
              <span
                v-for="(_, i) in 3"
                :key="i"
                :class="[
                  '!inline-block !h-2 !w-2 !rounded-full !animate-pulse',
                  clientSideTheme && isDark ? '!bg-gray-400' : '!bg-gray-300',
                ]"
                :style="{
                  marginLeft: i > 0 ? '0.25rem' : 0,
                  marginRight: i < 2 ? '0.25rem' : 0,
                  animationDelay: `${i * 0.2}s`,
                }"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize Handle -->
      <div
        class="!mb-6 !h-2 !w-full !cursor-ns-resize !flex !justify-center !items-center hover:!bg-gray-300 dark:hover:!bg-gray-700 !transition-colors !rounded-b-lg"
        @mousedown="startResize"
        @touchstart="startResize"
      >
        <div
          :class="[
            '!w-12 !h-1 !rounded-full',
            clientSideTheme && isDark ? '!bg-gray-600' : '!bg-gray-300',
          ]"
        ></div>
      </div>

      <!-- Prompt Suggestions -->
      <div class="!mb-0.5 !relative">
        <div
          ref="promptBarRef"
          class="prompt-bar !flex !overflow-x-auto !space-x-2 !pb-1 !scroll-smooth !px-2"
          @scroll="updatePromptScrollButtons"
        >
          <button
            v-for="(suggestion, idx) in PROMPT_SUGGESTIONS"
            :key="idx"
            type="button"
            :disabled="isInitialLoading"
            :class="[
              '!px-4 !py-2 !rounded-full !text-sm !font-medium !transition-colors !shadow',
              '!border !whitespace-nowrap',
              clientSideTheme && isDark
                ? '!bg-gray-800 !text-gray-100 !border-gray-700 hover:!bg-gray-700'
                : '!bg-white !text-gray-800 !border-gray-200 hover:!bg-gray-100',
              isInitialLoading && '!opacity-50 !cursor-not-allowed',
            ]"
            @click="setSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Input Form -->
      <form
        :class="[
          '!mt-4 !flex !rounded-lg !overflow-hidden !shadow-md',
          clientSideTheme && isDark
            ? '!bg-gray-800 !border !border-gray-700'
            : '!bg-gray-100 !border !border-gray-200',
        ]"
        @submit.prevent="sendMessage"
      >
        <textarea
          ref="inputRef"
          v-model="userInput"
          placeholder="Ask something about Steve..."
          :class="[
            '!flex-1 !border-0 !p-3 !outline-none !focus:ring-0 !resize-none',
            '!min-h-[42px] !max-h-[200px] !overflow-y-auto',
            clientSideTheme && isDark
              ? '!bg-gray-800 !text-gray-100 !placeholder-gray-500'
              : '!bg-gray-100 !text-gray-800 !placeholder-gray-400',
          ]"
          :disabled="loading || isInitialLoading"
          rows="1"
          @keydown="handleKeyDown"
        ></textarea>
        <button
          type="submit"
          class="!bg-indigo-600 !hover:bg-indigo-700 !text-white !px-4 !transition-colors !flex !items-center !justify-center !min-w-[60px]"
          :disabled="loading || isInitialLoading"
        >
          <svg
            v-if="!loading"
            xmlns="http://www.w3.org/2000/svg"
            class="!h-5 !w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          <div
            v-else
            class="!h-5 !w-5 !border-2 !border-t-transparent !border-white !rounded-full !animate-spin"
          ></div>
        </button>
      </form>

      <!-- Feedback Modal -->
      <div
        v-if="showFeedbackModal"
        class="!absolute !inset-0 !flex !items-center !justify-center !z-50"
      >
        <div
          :class="[
            '!absolute !inset-0',
            clientSideTheme && isDark ? '!bg-black !bg-opacity-60' : '!bg-white !bg-opacity-60',
          ]"
        ></div>
        <div
          :class="[
            '!relative !rounded-lg !p-6 !w-96 !shadow-xl',
            clientSideTheme && isDark ? '!bg-gray-800 !text-white' : '!bg-white !text-gray-800',
          ]"
        >
          <h3
            :class="[
              '!text-lg !font-medium !mb-4',
              clientSideTheme && isDark ? '!text-white' : '!text-gray-900',
            ]"
          >
            How was your chat experience?
          </h3>
          <div class="!flex !space-x-4 !mb-6">
            <button
              :class="[
                '!flex-1 !py-2 !px-4 !rounded-lg !transition-colors',
                feedback === 'good'
                  ? '!bg-green-500 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                    : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="feedback = 'good'"
            >
              Good 👍
            </button>
            <button
              :class="[
                '!flex-1 !py-2 !px-4 !rounded-lg !transition-colors',
                feedback === 'bad'
                  ? '!bg-red-500 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                    : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="feedback = 'bad'"
            >
              Bad 👎
            </button>
          </div>
          <div class="!flex !justify-end !space-x-3">
            <button
              :class="[
                '!px-4 !py-2 !rounded-lg !transition-colors',
                clientSideTheme && isDark
                  ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                  : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="closeFeedbackModal"
            >
              Cancel
            </button>
            <button
              :disabled="!feedback || isEndingChat"
              :class="[
                '!px-4 !py-2 !rounded-lg !transition-colors',
                !feedback || isEndingChat
                  ? '!bg-gray-400 !text-white !cursor-not-allowed'
                  : '!bg-indigo-600 !text-white !hover:bg-indigo-700',
              ]"
              @click="submitFeedback"
            >
              {{ isEndingChat ? "Ending..." : "End Chat" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Mini Chat Mode (Other Pages) -->
  <div v-else-if="isClient && displayMode === 'mini'" class="!fixed !bottom-4 !right-4 !z-50">
    <!-- Chat Toggle Button -->
    <button
      v-if="!isMiniChat"
      class="!w-14 !h-14 !rounded-full !bg-indigo-600 !text-white !shadow-lg !flex !items-center !justify-center !transition-all hover:!bg-indigo-700"
      @click="toggleMiniChat"
    >
      <img src="/advocado.webp" alt="Advocado" class="!w-8 !h-8 !rounded-full" />
    </button>

    <!-- Mini Chat Window -->
    <div
      v-else
      :style="cssVars"
      :class="[
        '!rounded-2xl !shadow-2xl !transition-all !w-[calc(100vw-2rem)] sm:!w-[400px] !max-w-[400px]',
        clientSideTheme && isDark
          ? '!bg-gray-900 !border !border-gray-700'
          : '!bg-white !border !border-gray-200',
        '!flex !flex-col',
        isCompactMode ? '!h-auto' : '!max-h-[32rem]',
      ]"
    >
      <!-- Loading Overlay -->
      <div v-if="isInitialLoading" class="chat-loading-overlay">
        <div class="chat-loading-content">
          <div
            class="!h-6 !w-6 !border-4 !border-indigo-600 !border-t-transparent !rounded-full !animate-spin"
          ></div>
          <p
            :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'"
            class="!text-base"
          >
            Loading conversation...
          </p>
        </div>
      </div>

      <!-- Compact Mode -->
      <div v-if="isCompactMode" class="!relative !p-6 !pt-8">
        <!-- Close button -->
        <button
          :class="[
            '!absolute !top-3 !right-3 !p-1.5 !rounded-full !transition-colors',
            clientSideTheme && isDark
              ? '!text-gray-400 hover:!text-gray-200 hover:!bg-gray-700'
              : '!text-gray-500 hover:!text-gray-700 hover:!bg-gray-100',
          ]"
          @click="toggleMiniChat"
        >
          <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Welcome Header -->
        <div class="!text-center !mb-6">
          <div class="!flex !items-center !justify-center !mb-3">
            <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
            <h3
              :class="[
                '!text-xl !font-bold',
                clientSideTheme && isDark ? '!text-white' : '!text-gray-900',
              ]"
            >
              Chat with Advocado 🥑
            </h3>
          </div>
          <p
            :class="[
              '!text-base !leading-relaxed',
              clientSideTheme && isDark ? '!text-gray-300' : '!text-gray-600',
            ]"
          >
            {{ messages[0]?.content || "Hi! What would you like to learn about Steve today?" }}
          </p>
        </div>

        <!-- Prompt Suggestions -->
        <div class="!mb-6">
          <div class="!flex !flex-col !gap-3">
            <button
              v-for="suggestion in PROMPT_SUGGESTIONS.slice(0, 3)"
              :key="suggestion"
              type="button"
              :disabled="isInitialLoading"
              :class="[
                '!w-full !px-4 !py-3 !rounded-xl !text-base !font-medium !transition-all',
                '!border !text-left !shadow-sm',
                clientSideTheme && isDark
                  ? '!bg-gray-800 !text-gray-200 !border-gray-600 hover:!bg-gray-700'
                  : '!bg-gray-50 !text-gray-700 !border-gray-200 hover:!bg-gray-100',
                isInitialLoading && '!opacity-50 !cursor-not-allowed',
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
            :class="[
              '!flex-1 !rounded-lg !p-2 !text-base !resize-none !min-h-[2.5rem] !max-h-[100px]',
              '!border-0 !outline-none !focus:ring-0 !overflow-y-auto',
              clientSideTheme && isDark
                ? '!bg-gray-800 !text-gray-100 !placeholder-gray-400'
                : '!bg-gray-100 !text-gray-800 !placeholder-gray-500',
            ]"
            :disabled="loading || isInitialLoading"
            rows="1"
            @keydown="handleKeyDown"
          ></textarea>
          <button
            type="submit"
            :class="[
              '!rounded-lg !px-3 !transition-all !flex !items-center !justify-center !min-w-[48px]',
              userInput.trim() && !loading && !isInitialLoading
                ? '!bg-indigo-600 hover:!bg-indigo-700 !text-white'
                : clientSideTheme && isDark
                  ? '!bg-gray-700 !text-gray-400 !cursor-not-allowed'
                  : '!bg-gray-200 !text-gray-400 !cursor-not-allowed',
            ]"
            :disabled="loading || isInitialLoading || !userInput.trim()"
          >
            <svg
              v-if="!loading"
              xmlns="http://www.w3.org/2000/svg"
              class="!h-4 !w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <div
              v-else
              class="!h-4 !w-4 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"
            ></div>
          </button>
        </form>
      </div>

      <!-- Expanded Mode -->
      <div v-else class="!flex !flex-col !h-full">
        <!-- Header -->
        <div
          :class="[
            '!p-3 !flex !items-center !justify-between !border-b',
            clientSideTheme && isDark ? '!border-gray-700' : '!border-gray-200',
          ]"
        >
          <div class="!flex !items-center !gap-2">
            <div class="!h-2 !w-2 !rounded-full !bg-green-500"></div>
            <h3
              :class="[
                '!text-base !font-medium',
                clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800',
              ]"
            >
              Chat with Advocado 🥑
            </h3>
          </div>
          <div class="!flex !items-center !gap-2">
            <button
              v-if="hasOngoingThread"
              :disabled="isEndingChat || isInitialLoading"
              :class="[
                '!px-2 !py-1 !rounded !text-base !transition-colors',
                '!bg-indigo-600 !text-white hover:!bg-indigo-700',
                (isEndingChat || isInitialLoading) && '!opacity-50 !cursor-not-allowed',
              ]"
              @click="endChat"
            >
              {{ isEndingChat ? "Ending..." : "End" }}
            </button>
            <button
              :class="[
                '!p-1 !rounded hover:!bg-gray-100 dark:hover:!bg-gray-800',
                clientSideTheme && isDark ? '!text-gray-300' : '!text-gray-600',
              ]"
              @click="toggleMiniChat"
            >
              <svg class="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div ref="chatContainerRef" class="!flex-1 !overflow-y-auto !p-3 !space-y-3 !max-h-80">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="!flex !w-full"
            :class="[msg.role === 'user' ? '!justify-end' : '!justify-start']"
          >
            <div
              v-if="msg.content.trim()"
              :class="[
                '!rounded-lg !px-3 !py-2 !max-w-[85%] !text-base !shadow-md',
                msg.role === 'user'
                  ? '!bg-indigo-600 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-800 !text-gray-100 !border !border-gray-700'
                    : '!bg-white !text-gray-800 !border !border-gray-200',
              ]"
            >
              <div class="!flex !justify-between !items-center !mb-1">
                <span
                  :class="[
                    '!text-sm',
                    msg.role === 'user'
                      ? '!text-gray-200'
                      : clientSideTheme && isDark
                        ? '!text-gray-400'
                        : '!text-gray-500',
                  ]"
                >
                  {{ msg.role === "user" ? "You" : "Advocado" }}
                </span>
                <span
                  v-if="msg.timestamp"
                  :class="[
                    '!text-sm !ml-4',
                    msg.role === 'user'
                      ? '!text-gray-200'
                      : clientSideTheme && isDark
                        ? '!text-gray-400'
                        : '!text-gray-500',
                  ]"
                >
                  {{ formatTime(msg.timestamp) }}
                </span>
              </div>
              <div
                class="!whitespace-pre-wrap markdown-content"
                v-html="parseMarkdown(msg.content)"
              ></div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="loading" class="!flex !justify-start !w-full">
            <div
              :class="[
                '!rounded-lg !px-3 !py-2 !max-w-[85%] !text-base !shadow-md',
                clientSideTheme && isDark
                  ? '!bg-gray-800 !text-gray-300 !border !border-gray-700'
                  : '!bg-white !text-gray-600 !border !border-gray-200',
              ]"
            >
              <div class="!flex !justify-between !items-center !mb-1">
                <span
                  :class="
                    clientSideTheme && isDark
                      ? '!text-sm !text-gray-400'
                      : '!text-sm !text-gray-500'
                  "
                >
                  Advocado
                </span>
                <span
                  :class="
                    clientSideTheme && isDark
                      ? '!text-sm !text-gray-400 !ml-4'
                      : '!text-sm !text-gray-500 !ml-4'
                  "
                >
                  {{ formatTime(Date.now()) }}
                </span>
              </div>
              <div class="!flex !items-center">
                <span
                  v-for="(_, i) in 3"
                  :key="i"
                  :class="[
                    '!inline-block !h-1.5 !w-1.5 !rounded-full !animate-pulse',
                    clientSideTheme && isDark ? '!bg-gray-400' : '!bg-gray-300',
                  ]"
                  :style="{
                    marginLeft: i > 0 ? '0.25rem' : 0,
                    marginRight: i < 2 ? '0.25rem' : 0,
                    animationDelay: `${i * 0.2}s`,
                  }"
                ></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div
          :class="[
            '!p-3 !border-t',
            clientSideTheme && isDark ? '!border-gray-700' : '!border-gray-200',
          ]"
        >
          <form class="!flex !gap-2" @submit.prevent="sendMessage">
            <textarea
              ref="inputRef"
              v-model="userInput"
              placeholder="AMA about Steve! 🎤"
              :class="[
                '!flex-1 !rounded-lg !p-2 !text-base !resize-none !min-h-[2.5rem] !max-h-[100px]',
                '!border-0 !outline-none !focus:ring-0 !overflow-y-auto',
                clientSideTheme && isDark
                  ? '!bg-gray-800 !text-gray-100 !placeholder-gray-400'
                  : '!bg-gray-100 !text-gray-800 !placeholder-gray-500',
              ]"
              :disabled="loading || isInitialLoading"
              rows="1"
              @keydown="handleKeyDown"
            ></textarea>
            <button
              type="submit"
              :class="[
                '!rounded-lg !px-3 !transition-all !flex !items-center !justify-center !min-w-[48px]',
                userInput.trim() && !loading && !isInitialLoading
                  ? '!bg-indigo-600 hover:!bg-indigo-700 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-700 !text-gray-400 !cursor-not-allowed'
                    : '!bg-gray-200 !text-gray-400 !cursor-not-allowed',
              ]"
              :disabled="loading || isInitialLoading || !userInput.trim()"
            >
              <svg
                v-if="!loading"
                xmlns="http://www.w3.org/2000/svg"
                class="!h-4 !w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <div
                v-else
                class="!h-4 !w-4 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"
              ></div>
            </button>
          </form>
        </div>
      </div>

      <!-- Feedback Modal -->
      <div
        v-if="showFeedbackModal"
        class="!absolute !inset-0 !flex !items-center !justify-center !bg-black !bg-opacity-50 !rounded-lg !z-50"
      >
        <div
          :class="[
            '!relative !rounded-lg !p-4 !w-72 !mx-4 !shadow-xl',
            clientSideTheme && isDark ? '!bg-gray-800 !text-white' : '!bg-white !text-gray-800',
          ]"
        >
          <h3
            :class="[
              '!text-base !font-medium !mb-3',
              clientSideTheme && isDark ? '!text-white' : '!text-gray-900',
            ]"
          >
            How was your chat experience?
          </h3>
          <div class="!flex !space-x-2 !mb-4">
            <button
              :class="[
                '!flex-1 !py-1 !px-2 !rounded !text-base !transition-colors',
                feedback === 'good'
                  ? '!bg-green-500 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                    : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="feedback = 'good'"
            >
              Good 👍
            </button>
            <button
              :class="[
                '!flex-1 !py-1 !px-2 !rounded !text-base !transition-colors',
                feedback === 'bad'
                  ? '!bg-red-500 !text-white'
                  : clientSideTheme && isDark
                    ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                    : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="feedback = 'bad'"
            >
              Bad 👎
            </button>
          </div>
          <div class="!flex !justify-end !space-x-2">
            <button
              :class="[
                '!px-3 !py-1 !rounded !text-base !transition-colors',
                clientSideTheme && isDark
                  ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                  : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
              ]"
              @click="closeFeedbackModal"
            >
              Cancel
            </button>
            <button
              :disabled="!feedback || isEndingChat"
              :class="[
                '!px-3 !py-1 !rounded !text-base !transition-colors',
                !feedback || isEndingChat
                  ? '!bg-gray-400 !text-white !cursor-not-allowed'
                  : '!bg-indigo-600 !text-white hover:!bg-indigo-700',
              ]"
              @click="submitFeedback"
            >
              {{ isEndingChat ? "Ending..." : "End Chat" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Include all the existing styles from both components */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.chat-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  border-radius: 0.5rem;
}

.dark .chat-loading-overlay {
  background: rgba(30, 30, 30, 0.7);
}

.chat-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

:deep(.markdown-content) {
  line-height: 1.4 !important;
}

:deep(.markdown-content p),
:deep(.markdown-content ul),
:deep(.markdown-content ol),
:deep(.markdown-content pre),
:deep(.markdown-content blockquote) {
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.markdown-content > * + *) {
  margin-top: 0.4em !important;
}

:deep(.markdown-content p + p) {
  margin-top: 0.4em !important;
}

:deep(.markdown-content li),
:deep(.markdown-content li p) {
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-left: 1rem !important;
  padding: 0 !important;
}

:deep(.markdown-content ul) {
  list-style-type: disc !important;
}

:deep(.markdown-content ol) {
  list-style-type: decimal !important;
}

:deep(.markdown-content strong) {
  font-weight: bold !important;
}

:deep(.markdown-content em) {
  font-style: italic !important;
}

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

:deep(.markdown-content a) {
  color: var(--link-color) !important;
  text-decoration: underline !important;
}

:deep(.markdown-content blockquote) {
  border-left: 3px solid var(--blockquote-border-color) !important;
  padding-left: 1rem !important;
  font-style: italic !important;
  margin: 0 !important;
}

/* Prompt bar scrollbar styles */
@media (min-width: 640px) {
  .prompt-bar::-webkit-scrollbar {
    height: 4px !important;
  }

  .prompt-bar::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }

  .prompt-bar::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }

  .prompt-bar {
    scrollbar-width: thin !important;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }
}

@media (max-width: 639px) {
  .prompt-bar::-webkit-scrollbar {
    display: none !important;
    height: 0 !important;
  }

  .prompt-bar {
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }
}
</style>
