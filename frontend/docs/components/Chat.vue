<script lang="ts" setup>
import { ref, nextTick, onMounted, watch, computed, onBeforeUnmount } from "vue";
import { marked } from "marked";
import { useData } from "vitepress";
import { Role } from "langbase";

// --- Types ---
interface ChatMessage {
  role: Role;
  content: string;
  timestamp?: number;
}

// --- State ---
const userInput = ref("");
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const isInitialLoading = ref(false);
const isDragging = ref(false);
const chatHeight = ref(500);
const clientSideTheme = ref(false);
const isClient = ref(false);
const isEndingChat = ref(false);
const showFeedbackModal = ref(false);
const feedback = ref<"good" | "bad" | null>(null);
const threadId = ref<string | null>(null);
const promptBarRef = ref<HTMLDivElement | null>(null);
const showLeftScroll = ref(false);
const showRightScroll = ref(false);
const isFirstMessageSent = ref(false); // Track if first message has been sent
const isMobile = ref(false); // Track if the device is mobile

const WITTY_MESSAGES = [
  "Oh my, looks like something is wrong with Advocado 🥑. You can [read about Steve here](/about) or try again later!",
  "Oops! Advocado seems to have taken a little nap 😴. While you wait, why not [learn about Steve](/about)? Or try again in a moment!",
  "Looks like Advocado is having a bad hair day! 🌪️ Try again soon, or [check out Steve's profile](/about)!",
  "Advocado is feeling a bit under the weather today 🤒. Please try again later, or [read about Steve](/about)!",
  "Advocado is currently doing some avocado yoga to recover 🧘‍♂️. [Browse Steve's info](/about) or try again in a bit!",
  "Looks like Advocado spilled its guacamole! 🥑💦 While we clean up, [learn about Steve](/about) or try again later!",
  "Advocado is currently on a quick coffee break ☕. [Read Steve's story](/about) or try again in a moment!",
  "Looks like Advocado is having a moment... 🤔 Try again soon, or [discover more about Steve](/about)!",
  "Advocado is practicing its avocado meditation 🧘‍♀️. Please try again later, or [explore Steve's background](/about)!",
  "Looks like Advocado is doing some emergency guac maintenance! 🛠️ [Check out Steve's profile](/about) or try again in a bit!",
];

const API_BASE = "https://advocado-agent.vercel.app";

// --- DOM Refs ---
const inputRef = ref<HTMLTextAreaElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const chatWindowRef = ref<HTMLDivElement | null>(null);

// --- Message Input Handling ---
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (userInput.value.trim()) {
      sendMessage();
    }
  }
};

// Auto-resize textarea as content grows
const resizeTextarea = () => {
  if (!inputRef.value) return;

  // Reset height to auto first to get the correct scrollHeight
  inputRef.value.style.height = "auto";

  // Set new height based on scrollHeight (with a max height)
  const newHeight = Math.min(inputRef.value.scrollHeight, 200);
  inputRef.value.style.height = `${newHeight}px`;
};

// Watch for input changes to auto-resize
watch(userInput, () => {
  nextTick(resizeTextarea);
});

// --- Theme ---
const { isDark } = useData();
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
const isWittyMessage = (msg: ChatMessage, index: number): boolean => {
  if (msg.role === "assistant" && WITTY_MESSAGES.includes(msg.content as string)) {
    return true;
  }
  if (msg.role === "user" && index < messages.value.length - 1) {
    const nextMessage = messages.value[index + 1];
    return (
      nextMessage.role === "assistant" && WITTY_MESSAGES.includes(nextMessage.content as string)
    );
  }
  return false;
};

const saveMessagesToStorage = (): void => {
  if (!isClient.value) return;
  const messagesToSave = messages.value.filter((msg, index) => !isWittyMessage(msg, index));
  localStorage.setItem("chatMessages", JSON.stringify(messagesToSave));
};

const handleStorageChange = (event: StorageEvent): void => {
  if (!isClient.value) return;
  switch (event.key) {
    case "chatMessages": {
      try {
        const newMessages = JSON.parse(event.newValue || "[]");
        if (Array.isArray(newMessages)) {
          messages.value = newMessages;
        }
      } catch (error) {
        console.error("Error parsing chat messages from storage:", error);
        messages.value = [];
      }
      break;
    }
    case "threadId": {
      threadId.value = event.newValue;
      if (!event.newValue) {
        messages.value = [
          {
            role: "assistant",
            content: "Hi! What would you like to learn about Steve today?",
            timestamp: Date.now(),
          },
        ];
        isFirstMessageSent.value = false;
      }
      break;
    }
    case "chatEnding": {
      if (event.newValue === "true" && showFeedbackModal.value) {
        showFeedbackModal.value = false;
        feedback.value = null;
      }
      break;
    }
  }
};

const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const parseMarkdown = (content: string): string | Promise<string> => marked.parse(content);

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (!chatContainerRef.value) return;

  // Use requestAnimationFrame for smoother scrolling
  requestAnimationFrame(() => {
    if (!chatContainerRef.value) return;

    // Check if we're already at the bottom to avoid unnecessary scrolling
    const isAtBottom =
      chatContainerRef.value.scrollHeight - chatContainerRef.value.scrollTop <=
      chatContainerRef.value.clientHeight + 50;

    if (!isAtBottom) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

// Check if device is mobile
const checkIfMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  // Use both screen width and user agent for better detection
  return (
    window.innerWidth < 768 ||
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

// Set the chat window to full height and scroll to it
const setFullHeightAndScroll = async (): Promise<void> => {
  if (!isClient.value || !chatWindowRef.value) return;

  // Calculate viewport height considering virtual keyboards on mobile
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  // Set chat height to viewport height with a small buffer for mobile
  chatHeight.value = isMobile.value ? viewportHeight - 20 : viewportHeight;

  // Save height to localStorage
  localStorage.setItem("chatHeight", chatHeight.value.toString());

  // For mobile devices, handle differently
  if (isMobile.value) {
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      if (!chatWindowRef.value) return;
      const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });

      // Additional scroll to bottom with a slight delay to ensure rendering
      setTimeout(scrollToBottom, 150);
    });
  } else {
    // Desktop behavior
    await nextTick();
    if (!chatWindowRef.value) return;
    const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });
  }
};

const updatePromptScrollButtons = (): void => {
  const el = promptBarRef.value;
  if (!el) return;
  showLeftScroll.value = el.scrollLeft > 0;
  showRightScroll.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

// --- Chat Window Resize ---
interface ResizeState {
  startY: number;
  startHeight: number;
}

const resizeState = ref<ResizeState>({
  startY: 0,
  startHeight: 0,
});

const startResize = (e: MouseEvent | TouchEvent): void => {
  e.preventDefault();
  isDragging.value = true;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  resizeState.value = {
    startY: clientY,
    startHeight: chatHeight.value,
  };

  if ("touches" in e) {
    document.addEventListener("touchmove", handleTouchResize, {
      passive: false,
    });
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
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("chatHeight", chatHeight.value.toString());
  }
};

// --- Message Handling ---
const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim()) return;

  // Check if this is the first user message being sent
  const isFirstMessage =
    messages.value.length <= 1 &&
    messages.value[0]?.role === "assistant" &&
    messages.value[0]?.content.includes("Hi! What would you like to learn about Steve today?");

  messages.value.push({
    role: "user",
    content: userInput.value,
    timestamp: Date.now(),
  });
  saveMessagesToStorage();

  // Within the sendMessage function, replace the first message handling with:
  // If this is the first actual message from the user, expand to full screen
  if (isFirstMessage && !isFirstMessageSent.value) {
    isFirstMessageSent.value = true;

    // Use setTimeout to ensure DOM is ready
    setTimeout(async () => {
      await setFullHeightAndScroll();

      // For mobile, add another scroll check after keyboard appears/disappears
      if (isMobile.value) {
        window.addEventListener(
          "resize",
          function onResize() {
            scrollToBottom();
            // Remove this event listener after first firing
            window.removeEventListener("resize", onResize);
          },
          { once: true },
        );
      }
    }, 50);
  }

  let currentAssistantContent = "";
  let assistantMessageAdded = false;
  loading.value = true;
  try {
    const requestBody: {
      stream: boolean;
      rawResponse: boolean;
      messages: { role: string; content: string }[];
      threadId?: string;
    } = {
      stream: true,
      rawResponse: true,
      messages: [{ role: "user", content: userInput.value }],
    };

    if (threadId.value) requestBody.threadId = threadId.value;

    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.body) throw new Error("No response body");

    const threadIdHeader = response.headers.get("lb-thread-id");
    if (threadIdHeader && isClient.value) {
      localStorage.setItem("threadId", threadIdHeader);
      threadId.value = threadIdHeader;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // eslint-disable-next-line no-constant-condition
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
              messages.value.push({
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              });
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
        content: "[Error receiving response]",
        timestamp: Date.now(),
      });
    } else if (currentAssistantContent.trim() === "") {
      messages.value[messages.value.length - 1].content = "[Error receiving response]";
    }
    saveMessagesToStorage();
  } finally {
    loading.value = false;
    userInput.value = "";
    // Reset textarea height
    if (inputRef.value) {
      inputRef.value.style.height = "auto";
    }
    await nextTick();
    if (inputRef.value) inputRef.value.focus();
    await scrollToBottom();
    saveMessagesToStorage();
  }
};

// --- End Chat & Feedback Modal ---
const endChat = (): void => {
  if (isEndingChat.value || showFeedbackModal.value) return;
  if (!threadId.value) return;
  showFeedbackModal.value = true;
  feedback.value = null;
};

const submitFeedback = async (): Promise<void> => {
  if (!feedback.value || isEndingChat.value) return;
  isEndingChat.value = true;
  try {
    if (!threadId.value) return;
    const response = await fetch(`${API_BASE}/thread/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId.value,
        feedback: feedback.value,
      }),
    });
    if (!response.ok) throw new Error("Failed to end chat");
    localStorage.removeItem("threadId");
    localStorage.removeItem("chatMessages");
    console.log("Chat session ended successfully");
    threadId.value = null;
    messages.value.push({
      role: "assistant",
      content: "Chat session has ended. Ask me anything to start a new conversation!",
      timestamp: Date.now(),
    });
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

// --- Prompt Suggestions ---
const promptSuggestions = [
  "Tell me about Steve's background",
  "What are Steve's top skills?",
  "Summarize Steve's work experience",
  "Show me Steve's recent projects",
  "How can I contact Steve?",
];

function setSuggestion(suggestion: string): void {
  userInput.value = suggestion;
  inputRef.value?.focus();
}

// --- Window Resize Event Handler ---
const handleWindowResize = () => {
  // Check if device is mobile when window is resized
  isMobile.value = checkIfMobile();

  // If we've sent the first message, update the height to fit the viewport
  if (isFirstMessageSent.value) {
    chatHeight.value = window.innerHeight;
    localStorage.setItem("chatHeight", chatHeight.value.toString());

    // For mobile devices, trigger additional scrolling to ensure visibility
    if (isMobile.value) {
      setTimeout(() => {
        scrollToBottom();

        // If chat window exists, scroll to it
        if (chatWindowRef.value) {
          const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }
  updatePromptScrollButtons();
};

// Handle visibility change for mobile browsers
const handleVisibilityChange = () => {
  if (!document.hidden && isFirstMessageSent.value && isMobile.value) {
    // Use requestAnimationFrame for smoother handling
    requestAnimationFrame(() => {
      if (!chatWindowRef.value) return;

      // Get current orientation to handle orientation changes
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const viewportHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

      // Adjust height based on orientation
      chatHeight.value = isLandscape ? viewportHeight - 40 : viewportHeight - 20;
      localStorage.setItem("chatHeight", chatHeight.value.toString());

      const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });

      // Ensure messages are visible
      setTimeout(scrollToBottom, 100);
    });
  }
};

// --- Initial Load ---
onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;

  // Check if device is mobile
  isMobile.value = checkIfMobile();

  threadId.value = typeof localStorage !== "undefined" ? localStorage.getItem("threadId") : null;

  // Load messages from localStorage if present
  const storedMessages =
    typeof localStorage !== "undefined" ? localStorage.getItem("chatMessages") : null;
  if (storedMessages) {
    try {
      const parsedMessages = JSON.parse(storedMessages);
      if (Array.isArray(parsedMessages)) {
        messages.value = parsedMessages;
        if (parsedMessages.length > 0) {
          isFirstMessageSent.value = true;
        }
      }
    } catch (error) {
      console.error("Error parsing stored messages:", error);
      messages.value = [
        {
          role: "assistant",
          content: "Hi! What would you like to learn about Steve today?",
          timestamp: Date.now(),
        },
      ];
    }
  } else {
    messages.value = [
      {
        role: "assistant",
        content: "Hi! What would you like to learn about Steve today?",
        timestamp: Date.now(),
      },
    ];
  }

  if (isClient.value) {
    window.addEventListener("storage", handleStorageChange);
  }
  scrollToBottom();
  inputRef.value?.focus();
  nextTick(() => {
    updatePromptScrollButtons();
    promptBarRef.value?.addEventListener("scroll", updatePromptScrollButtons);
    // Initialize textarea resize
    if (inputRef.value) {
      resizeTextarea();
      inputRef.value.addEventListener("input", resizeTextarea);
    }
  });
});

// --- Clean up event listeners ---
const cleanupEventListeners = () => {
  window.removeEventListener("resize", handleWindowResize);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  promptBarRef.value?.removeEventListener("scroll", updatePromptScrollButtons);
  if (inputRef.value) {
    inputRef.value.removeEventListener("input", resizeTextarea);
  }
  if (isMobile.value && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.removeEventListener("scroll", () => {});
  }
};

onBeforeUnmount(() => {
  cleanupEventListeners();
  window.removeEventListener("storage", handleStorageChange);
});

// --- Watchers ---
watch(
  messages,
  () => {
    scrollToBottom();
    saveMessagesToStorage();
  },
  { deep: true },
);

// Remove empty watch on isDark
</script>

<template>
  <div
    v-if="isClient"
    ref="chatWindowRef"
    :style="{ height: `${chatHeight}px`, ...cssVars }"
    :class="[
      '!relative',
      '!flex !w-full !flex-col !rounded-lg !p-4 !shadow-lg',
      clientSideTheme && isDark
        ? '!border !border-gray-700 !bg-gray-900'
        : '!border !border-gray-200 !bg-gray-50',
    ]"
  >
    <!-- Overlay for initial loading -->
    <div v-if="isInitialLoading" class="chat-loading-overlay">
      <div class="chat-loading-content">
        <div
          class="!h-8 !w-8 !border-4 !border-indigo-600 !border-t-transparent !rounded-full !animate-spin"
        ></div>
        <p :class="clientSideTheme && isDark ? '!text-gray-200' : '!text-gray-700'">
          Loading past conversations...
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
          '!px-3 !py-1 !rounded-lg !text-sm !transition-colors !duration-200 !ease-in-out',
          '!bg-indigo-600 !hover:bg-indigo-700 !text-white',
          (isEndingChat || isInitialLoading) && '!opacity-50 !cursor-not-allowed',
        ]"
        @click="endChat"
      >
        {{ isEndingChat ? "Ending..." : "End Chat" }}
      </button>
    </div>

    <!-- Messages area -->
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
              >{{ msg.role === "user" ? "You" : "Advocado" }}</span
            >
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
              >{{ formatTime(msg.timestamp) }}</span
            >
          </div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="!whitespace-pre-wrap markdown-content"
            v-html="parseMarkdown(msg.content)"
          ></div>
          <!-- eslint-enable -->
        </div>
      </div>

      <!-- Typing indicator -->
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
              >Advocado</span
            >
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

    <!-- Resize handle -->
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

    <!-- Prompt Suggestions (responsive scroll bar, no buttons) -->
    <div class="!mb-0.5 !relative">
      <div
        ref="promptBarRef"
        class="prompt-bar !flex !overflow-x-auto !space-x-2 !pb-1 !scroll-smooth !px-2"
        @scroll="updatePromptScrollButtons"
      >
        <button
          v-for="(suggestion, idx) in promptSuggestions"
          :key="idx"
          type="button"
          :disabled="isInitialLoading"
          :class="[
            '!px-4 !py-2 !rounded-full !text-sm !font-medium !transition-colors !duration-200 !shadow',
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

    <!-- Input form -->
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
          '!flex-1 !border-0 !p-3 !outline-none !focus:ring-0 !focus:ring-offset-0 !resize-none',
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
        class="!bg-indigo-600 !hover:bg-indigo-700 !text-white !px-4 !transition-colors !duration-200 !ease-in-out !flex !items-center !justify-center !min-w-[60px]"
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

    <!-- Feedback Modal (inside chat window) -->
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
              '!flex-1 !py-2 !px-4 !rounded-lg !transition-colors !duration-200',
              feedback === 'good'
                ? '!bg-green-500 !text-white'
                : clientSideTheme && isDark
                  ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                  : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
            ]"
            :disabled="isInitialLoading"
            @click="feedback = 'good'"
          >
            Good 👍
          </button>
          <button
            :class="[
              '!flex-1 !py-2 !px-4 !rounded-lg !transition-colors !duration-200',
              feedback === 'bad'
                ? '!bg-red-500 !text-white'
                : clientSideTheme && isDark
                  ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                  : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
            ]"
            :disabled="isInitialLoading"
            @click="feedback = 'bad'"
          >
            Bad 👎
          </button>
        </div>
        <div class="!flex !justify-end !space-x-3">
          <button
            :class="[
              '!px-4 !py-2 !rounded-lg !transition-colors !duration-200',
              clientSideTheme && isDark
                ? '!bg-gray-700 !text-gray-300 !hover:bg-gray-600'
                : '!bg-gray-100 !text-gray-700 !hover:bg-gray-200',
            ]"
            :disabled="isInitialLoading"
            @click="closeFeedbackModal"
          >
            Cancel
          </button>
          <button
            :disabled="!feedback || isEndingChat || isInitialLoading"
            :class="[
              '!px-4 !py-2 !rounded-lg !transition-colors !duration-200',
              !feedback || isEndingChat || isInitialLoading
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

  <div
    v-else
    class="!flex !w-full !flex-col !rounded-lg !p-4 !shadow-lg !relative !border !border-gray-200 !bg-gray-50"
  >
    <div class="!mb-4 !pb-3 !flex !items-center !justify-between !border-b !border-gray-200">
      <div class="!flex !items-center">
        <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
        <h3 class="!text-gray-800 !font-medium">Chat with Advocado 🥑</h3>
      </div>
    </div>
    <div class="!flex-1 !flex !items-center !justify-center">
      <p class="!text-gray-600">Loading chat...</p>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling */
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

/* Markdown styling */
:deep(.markdown-content) {
  line-height: 1.4 !important;
  /* slightly tighter for chat */
}

/* Remove margin/padding from paragraphs, lists, pre/code, blockquotes */
:deep(.markdown-content p),
:deep(.markdown-content ul),
:deep(.markdown-content ol),
:deep(.markdown-content pre),
:deep(.markdown-content blockquote) {
  margin: 0 !important;
  padding: 0 !important;
}

/* Tight spacing between sibling blocks (paragraphs, lists, etc.) */
:deep(.markdown-content > * + *) {
  margin-top: 0.4em !important;
  /* em units scale with font size */
}

/* Paragraphs that follow another paragraph (extra safe for nested structure) */
:deep(.markdown-content p + p) {
  margin-top: 0.4em !important;
}

/* Remove default margin/padding from list items and nested paragraphs */
:deep(.markdown-content li),
:deep(.markdown-content li p) {
  margin: 0 !important;
  padding: 0 !important;
}

/* Tighter left margin for lists for less indentation */
:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-left: 1rem !important;
  /* less than default 1.5rem */
  padding: 0 !important;
}

/* Standard list-style */
:deep(.markdown-content ul) {
  list-style-type: disc !important;
}

:deep(.markdown-content ol) {
  list-style-type: decimal !important;
}

/* Strong/italic */
:deep(.markdown-content strong) {
  font-weight: bold !important;
}

:deep(.markdown-content em) {
  font-style: italic !important;
}

/* Inline code */
:deep(.markdown-content code) {
  font-family: monospace !important;
  background-color: var(--code-bg-color) !important;
  padding: 0.1rem 0.3rem !important;
  border-radius: 0.25rem !important;
}

/* Code block */
:deep(.markdown-content pre code) {
  display: block !important;
  padding: 0.75rem !important;
  margin-bottom: 0.5rem !important;
  overflow-x: auto !important;
}

/* Links */
:deep(.markdown-content a) {
  color: var(--link-color) !important;
  text-decoration: underline !important;
}

/* Blockquote */
:deep(.markdown-content blockquote) {
  border-left: 3px solid var(--blockquote-border-color) !important;
  padding-left: 1rem !important;
  font-style: italic !important;
  margin: 0 !important;
}

/* Desktop: slim horizontal scrollbar for prompt bar */
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

/* Mobile: hide horizontal scrollbar for prompt bar */
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

/* Hide scrollbar */
.hide-scrollbar::-webkit-scrollbar {
  display: none !important;
  height: 0 !important;
}

.hide-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

/* Overlay for initial loading */
.chat-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}

.dark .chat-loading-overlay {
  background: rgba(30, 30, 30, 0.7);
}

.chat-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>
