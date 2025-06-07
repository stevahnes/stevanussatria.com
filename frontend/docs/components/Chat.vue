<script lang="ts" setup>
import { ref, nextTick, onMounted, watch, computed, onBeforeUnmount } from "vue";
import { marked } from "marked";
import { useData } from "vitepress";
import { Message, Role } from "langbase";

// --- Enhanced Types ---
interface ChatMessage {
  role: Role;
  content: string;
  timestamp?: number;
}

interface ResizeState {
  startY: number;
  startHeight: number;
}

interface ChatRequest {
  stream: boolean;
  rawResponse: boolean;
  messages: { role: string; content: string }[];
  threadId?: string;
}

// --- Constants ---
const WITTY_ERROR_MESSAGES = [
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
] as const;

const PROMPT_SUGGESTIONS = [
  "Tell me about Steve's background",
  "What are Steve's top skills?",
  "Summarize Steve's work experience",
  "Show me Steve's recent projects",
  "How can I contact Steve?",
] as const;

const API_BASE = "https://advocado-agent.vercel.app";

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
const showLeftScroll = ref(false);
const showRightScroll = ref(false);
const isMobile = ref(false);

// --- New state for compact mode ---
const isCompactMode = ref(true); // Start in compact mode
const hasStartedChat = ref(false); // Track if user has started chatting

// --- FIXED: Simplified scroll behavior state ---
const hasFirstMessageBeenSent = ref(false); // Track if first message has been sent
const shouldAutoExpandOnFirstMessage = ref(true); // Control auto-expansion behavior

// --- DOM Refs ---
const inputRef = ref<HTMLTextAreaElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const chatWindowRef = ref<HTMLDivElement | null>(null);
const promptBarRef = ref<HTMLDivElement | null>(null);

const resizeState = ref<ResizeState>({ startY: 0, startHeight: 0 });

// --- Theme & Computed ---
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

const hasOngoingThread = computed(() => !!threadId.value);

// --- Utility Functions ---
const getRandomWittyMessage = (): string =>
  WITTY_ERROR_MESSAGES[Math.floor(Math.random() * WITTY_ERROR_MESSAGES.length)];

const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const parseMarkdown = (content: string): string | Promise<string> => marked.parse(content);

const checkIfMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

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
  const newHeight = Math.min(inputRef.value.scrollHeight, 200);
  inputRef.value.style.height = `${newHeight}px`;
};

const updatePromptScrollButtons = (): void => {
  const el = promptBarRef.value;
  if (!el) return;
  showLeftScroll.value = el.scrollLeft > 0;
  showRightScroll.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

// --- FIXED: Only expand and scroll to viewport on first message or when restoring chat ---
const setFullHeightAndScrollToViewport = async (): Promise<void> => {
  if (!isClient.value || !chatWindowRef.value) return;

  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  chatHeight.value = isMobile.value ? viewportHeight - 20 : viewportHeight;
  localStorage.setItem("chatHeight", chatHeight.value.toString());

  await nextTick();

  // Scroll the chat window into viewport
  const offsetTop = chatWindowRef.value.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({ top: offsetTop, behavior: "smooth" });

  if (isMobile.value) {
    setTimeout(scrollToBottom, 150);
  }
};

// --- FIXED: Expand chat window only on first message ---
const expandChatWindow = async (): Promise<void> => {
  if (!shouldAutoExpandOnFirstMessage.value) return;

  isCompactMode.value = false;
  hasStartedChat.value = true;
  hasFirstMessageBeenSent.value = true;

  await setFullHeightAndScrollToViewport();
};

// --- Storage Functions ---
const isWittyMessage = (msg: ChatMessage, index: number): boolean => {
  // Check if this is a witty error message
  if (
    msg.role === "assistant" &&
    WITTY_ERROR_MESSAGES.some(wittyMsg => msg.content.includes(wittyMsg.split(" ")[0]))
  ) {
    return true;
  }

  // Check if this user message is followed by a witty response
  if (msg.role === "user" && index < messages.value.length - 1) {
    const nextMessage = messages.value[index + 1];
    return (
      nextMessage.role === "assistant" &&
      WITTY_ERROR_MESSAGES.some(wittyMsg => nextMessage.content.includes(wittyMsg.split(" ")[0]))
    );
  }

  return false;
};

const saveMessagesToStorage = (): void => {
  if (!isClient.value) return;
  const messagesToSave = messages.value.filter((msg, index) => !isWittyMessage(msg, index));
  localStorage.setItem("chatMessages", JSON.stringify(messagesToSave));
};

// --- Resize Handlers ---
const startResize = (e: MouseEvent | TouchEvent): void => {
  if (isCompactMode.value) return; // Don't allow resize in compact mode

  e.preventDefault();
  isDragging.value = true;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  resizeState.value = { startY: clientY, startHeight: chatHeight.value };

  const moveHandler = (e: Event) => {
    if (!isDragging.value) return;
    const currentY =
      "touches" in (e as TouchEvent)
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY;
    const deltaY = currentY - resizeState.value.startY;
    chatHeight.value = Math.max(200, resizeState.value.startHeight + deltaY);
  };

  const stopHandler = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", stopHandler);
    document.removeEventListener("touchmove", moveHandler);
    document.removeEventListener("touchend", stopHandler);
    localStorage.setItem("chatHeight", chatHeight.value.toString());
  };

  if ("touches" in e) {
    document.addEventListener("touchmove", moveHandler, { passive: false });
    document.addEventListener("touchend", stopHandler);
  } else {
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", stopHandler);
  }
};

// --- Event Handlers ---
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (userInput.value.trim()) sendMessage();
  }
};

// --- FIXED: Simplified window resize - no auto-scroll ---
const handleWindowResize = (): void => {
  isMobile.value = checkIfMobile();
  // Only update dimensions if chat is expanded, but NO auto-scroll
  if (hasStartedChat.value && !isCompactMode.value) {
    chatHeight.value = window.innerHeight;
    localStorage.setItem("chatHeight", chatHeight.value.toString());
  }
  updatePromptScrollButtons();
};

// --- FIXED: No auto-scroll on visibility change ---
const handleVisibilityChange = (): void => {
  // Only update mobile dimensions, NO auto-scroll
  if (document.hidden || !hasStartedChat.value || !isMobile.value || isCompactMode.value) return;

  requestAnimationFrame(() => {
    if (!chatWindowRef.value) return;
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

    chatHeight.value = isLandscape ? viewportHeight - 40 : viewportHeight - 20;
    localStorage.setItem("chatHeight", chatHeight.value.toString());
  });
};

// --- FIXED: No auto-scroll on storage change ---
const handleStorageChange = (event: StorageEvent): void => {
  if (!isClient.value) return;

  switch (event.key) {
    case "chatEnding":
      if (event.newValue === "true" && showFeedbackModal.value) {
        showFeedbackModal.value = false;
        feedback.value = null;
      }
      break;
    case "threadId":
      threadId.value = event.newValue;
      if (!event.newValue) {
        messages.value = [];
        isCompactMode.value = true;
        hasStartedChat.value = false;
        hasFirstMessageBeenSent.value = false;
        shouldAutoExpandOnFirstMessage.value = true;
        localStorage.removeItem("chatEnding");
      }
      break;
    case "chatMessages":
      if (event.newValue) {
        try {
          const newMessages = JSON.parse(event.newValue);
          if (Array.isArray(newMessages)) {
            messages.value = newMessages;

            // Sync compact mode state based on messages but NO auto-scroll
            if (newMessages.length > 0) {
              isCompactMode.value = false;
              hasStartedChat.value = true;
              hasFirstMessageBeenSent.value = true;
              shouldAutoExpandOnFirstMessage.value = false; // Don't auto-expand on sync
            } else {
              isCompactMode.value = true;
              hasStartedChat.value = false;
              hasFirstMessageBeenSent.value = false;
              shouldAutoExpandOnFirstMessage.value = true;
            }
          }
        } catch (error) {
          console.error("Error parsing chat messages from storage:", error);
        }
      } else {
        // Messages cleared - reset to compact mode
        messages.value = [];
        isCompactMode.value = true;
        hasStartedChat.value = false;
        hasFirstMessageBeenSent.value = false;
        shouldAutoExpandOnFirstMessage.value = true;
      }
      break;
  }
};

// --- API Functions ---
const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim()) return;

  const isFirstMessage = messages.value.length === 0;

  const userMessage: ChatMessage = {
    role: "user",
    content: userInput.value,
    timestamp: Date.now(),
  };

  messages.value.push(userMessage);

  // FIXED: Only expand and scroll on actual first message
  if (isFirstMessage) {
    await expandChatWindow();
  }

  if (isClient.value) localStorage.setItem("hadChatInteraction", "true");

  let currentAssistantContent = "";
  let assistantMessageAdded = false;
  loading.value = true;

  try {
    const requestBody: ChatRequest = {
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
        content: getRandomWittyMessage(),
        timestamp: Date.now(),
      });
    } else if (currentAssistantContent.trim() === "") {
      messages.value[messages.value.length - 1].content = getRandomWittyMessage();
    }

    messages.value = [...messages.value];
    await scrollToBottom();
  } finally {
    loading.value = false;
    userInput.value = "";
    if (inputRef.value) inputRef.value.style.height = "auto";
    inputRef.value?.focus();
    await scrollToBottom();
  }
};

const endChat = (): void => {
  if (isEndingChat.value || showFeedbackModal.value || !threadId.value) return;
  showFeedbackModal.value = true;
  feedback.value = null;
  if (isClient.value) localStorage.setItem("chatEnding", "true");
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

    localStorage.removeItem("threadId");
    localStorage.removeItem("chatMessages");
    threadId.value = null;
    messages.value = [];
    isCompactMode.value = true;
    hasStartedChat.value = false;
    hasFirstMessageBeenSent.value = false;
    shouldAutoExpandOnFirstMessage.value = true;
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
const cleanupEventListeners = (): void => {
  window.removeEventListener("resize", handleWindowResize);
  window.removeEventListener("storage", handleStorageChange);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  promptBarRef.value?.removeEventListener("scroll", updatePromptScrollButtons);
  if (inputRef.value) inputRef.value.removeEventListener("input", resizeTextarea);
};

// --- Watchers ---
watch(userInput, () => nextTick(resizeTextarea));
watch(messages, saveMessagesToStorage, { deep: true });
watch(
  messages,
  () => {
    if (!isCompactMode.value) scrollToBottom();
  },
  { deep: true },
);

// --- Mount ---
onMounted(async () => {
  isClient.value = true;
  clientSideTheme.value = true;
  isMobile.value = checkIfMobile();

  threadId.value = localStorage.getItem("threadId");
  const storedMessages = localStorage.getItem("chatMessages");

  if (storedMessages) {
    try {
      const parsedMessages = JSON.parse(storedMessages);
      messages.value = parsedMessages;

      // If we have stored messages, restore the chat state
      if (parsedMessages.length > 0) {
        isCompactMode.value = false;
        hasStartedChat.value = true;
        hasFirstMessageBeenSent.value = true;
        shouldAutoExpandOnFirstMessage.value = false; // Don't auto-expand when restoring

        // FIXED: Only scroll to viewport when restoring existing chat
        setTimeout(() => setFullHeightAndScrollToViewport(), 100);
      }
    } catch (error) {
      console.error("Error parsing stored messages:", error);
      messages.value = [];
    }
  } else {
    messages.value = [];
  }

  // Only load from backend if we have threadId but no stored messages
  if (threadId.value && !storedMessages) {
    isInitialLoading.value = true;
    try {
      const response = await fetch(`${API_BASE}/thread/listMessages?threadId=${threadId.value}`);

      if (response.ok) {
        const messagesData = await response.json();
        if (messagesData && Array.isArray(messagesData)) {
          messages.value = messagesData.map((msg: Message) => ({
            role: msg.role,
            content: msg.content || "",
            timestamp: Date.now(),
          }));
          saveMessagesToStorage();

          const hasUserMessages = messagesData.some((msg: Message) => msg.role === "user");
          if (hasUserMessages) {
            isCompactMode.value = false;
            hasStartedChat.value = true;
            hasFirstMessageBeenSent.value = true;
            shouldAutoExpandOnFirstMessage.value = false;

            // FIXED: Only scroll to viewport when loading existing conversation
            setTimeout(() => setFullHeightAndScrollToViewport(), 100);
          }
        } else {
          // Invalid response data - reset to fresh state
          localStorage.removeItem("threadId");
          threadId.value = null;
          messages.value = [];
          isCompactMode.value = true;
          hasStartedChat.value = false;
          hasFirstMessageBeenSent.value = false;
          shouldAutoExpandOnFirstMessage.value = true;
        }
      } else {
        // API error or thread not found - reset to fresh state
        localStorage.removeItem("threadId");
        threadId.value = null;
        messages.value = [];
        isCompactMode.value = true;
        hasStartedChat.value = false;
        hasFirstMessageBeenSent.value = false;
        shouldAutoExpandOnFirstMessage.value = true;
      }
    } catch (error) {
      console.error("Error fetching thread messages:", error);
      // Network error - reset to fresh state
      localStorage.removeItem("threadId");
      threadId.value = null;
      messages.value = [];
      isCompactMode.value = true;
      hasStartedChat.value = false;
      hasFirstMessageBeenSent.value = false;
      shouldAutoExpandOnFirstMessage.value = true;
    } finally {
      isInitialLoading.value = false;
    }
  }

  const savedHeight = localStorage.getItem("chatHeight");
  if (savedHeight) chatHeight.value = parseInt(savedHeight);

  // Event listeners
  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("storage", handleStorageChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // FIXED: Removed iOS-specific scroll listener that was causing issues

  if (!isCompactMode.value) scrollToBottom();
  inputRef.value?.focus();

  await nextTick();
  updatePromptScrollButtons();
  promptBarRef.value?.addEventListener("scroll", updatePromptScrollButtons);
  if (inputRef.value) {
    resizeTextarea();
    inputRef.value.addEventListener("input", resizeTextarea);
  }
});

onBeforeUnmount(cleanupEventListeners);
</script>

<template>
  <div v-if="isClient">
    <!-- Compact Mode - Initial State -->
    <div
      v-if="isCompactMode"
      :class="[
        '!w-full !max-w-2xl !mx-auto !p-6 !rounded-lg !shadow-lg',
        clientSideTheme && isDark
          ? '!border !border-gray-700 !bg-gray-900'
          : '!border !border-gray-200 !bg-gray-50',
      ]"
    >
      <!-- Welcome Header -->
      <div class="!text-center !mb-8">
        <div class="!flex !items-center !justify-center !mb-4">
          <div class="!h-4 !w-4 !rounded-full !bg-green-500 !mr-3"></div>
          <h1
            :class="[
              '!text-2xl !font-bold',
              clientSideTheme && isDark ? '!text-gray-100' : '!text-gray-800',
            ]"
          >
            Chat with Advocado 🥑
          </h1>
        </div>
        <p :class="['!text-lg', clientSideTheme && isDark ? '!text-gray-300' : '!text-gray-600']">
          Hi! What would you like to learn about Steve today?
        </p>
      </div>

      <!-- Prompt Suggestions -->
      <div class="!mb-6 !relative">
        <div
          ref="promptBarRef"
          class="prompt-bar !flex !overflow-x-auto !space-x-3 !pb-2 !scroll-smooth !px-1"
          @scroll="updatePromptScrollButtons"
        >
          <button
            v-for="suggestion in PROMPT_SUGGESTIONS"
            :key="suggestion"
            type="button"
            :disabled="isInitialLoading"
            :class="[
              '!px-4 !py-3 !rounded-lg !text-sm !font-medium !transition-colors !duration-200 !shadow-sm',
              '!border !whitespace-nowrap !min-w-max',
              clientSideTheme && isDark
                ? '!bg-gray-800 !text-gray-100 !border-gray-600 hover:!bg-gray-700'
                : '!bg-white !text-gray-800 !border-gray-300 hover:!bg-gray-50',
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
          '!flex !rounded-lg !overflow-hidden !shadow-md !border',
          clientSideTheme && isDark
            ? '!bg-gray-800 !border-gray-600'
            : '!bg-white !border-gray-300',
        ]"
        @submit.prevent="sendMessage"
      >
        <textarea
          ref="inputRef"
          v-model="userInput"
          placeholder="AMA about Steve! 🎤"
          :class="[
            '!flex-1 !border-0 !p-4 !outline-none !focus:ring-0 !focus:ring-offset-0 !resize-none',
            '!min-h-[56px] !max-h-[200px] !text-base !overflow-y-auto',
            clientSideTheme && isDark
              ? '!bg-gray-800 !text-gray-100 !placeholder-gray-400'
              : '!bg-white !text-gray-800 !placeholder-gray-500',
            '[&::placeholder]:!text-ellipsis [&::placeholder]:!overflow-hidden [&::placeholder]:!whitespace-nowrap',
          ]"
          :disabled="loading || isInitialLoading"
          rows="1"
          @keydown="handleKeyDown"
        ></textarea>
        <button
          type="submit"
          :class="[
            '!transition-all !duration-200 !ease-in-out !flex !items-center !justify-center !min-w-[80px] !px-6 !shadow-sm',
            userInput.trim() && !loading && !isInitialLoading
              ? '!bg-indigo-600 !hover:bg-indigo-700 !text-white'
              : clientSideTheme && isDark
                ? '!bg-gray-700 !text-gray-400 !cursor-not-allowed'
                : '!bg-gray-200 !text-gray-400 !cursor-not-allowed',
          ]"
          :disabled="loading || isInitialLoading || !userInput.trim()"
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
            class="!h-5 !w-5 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"
          ></div>
        </button>
      </form>
    </div>

    <!-- Full Chat Mode - After First Message -->
    <div
      v-else
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
            <!-- eslint-disable vue/no-v-html -->
            <div
              class="!whitespace-pre-wrap markdown-content"
              v-html="parseMarkdown(msg.content)"
            ></div>
            <!-- eslint-enable -->
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

      <!-- Prompt Suggestions (in expanded mode) -->
      <div class="!mb-0.5 !relative">
        <div
          ref="promptBarRef"
          class="prompt-bar !flex !overflow-x-auto !space-x-2 !pb-1 !scroll-smooth !px-2"
          @scroll="updatePromptScrollButtons"
        >
          <button
            v-for="suggestion in PROMPT_SUGGESTIONS"
            :key="suggestion"
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
          placeholder="AMA about Steve! 🎤"
          :class="[
            '!flex-1 !border-0 !p-3 !outline-none !focus:ring-0 !focus:ring-offset-0 !resize-none',
            '!min-h-[42px] !max-h-[200px] !overflow-y-auto',
            clientSideTheme && isDark
              ? '!bg-gray-800 !text-gray-100 !placeholder-gray-500'
              : '!bg-gray-100 !text-gray-800 !placeholder-gray-400',
            '[&::placeholder]:!text-ellipsis [&::placeholder]:!overflow-hidden [&::placeholder]:!whitespace-nowrap',
          ]"
          :disabled="loading || isInitialLoading"
          rows="1"
          @keydown="handleKeyDown"
        ></textarea>
        <button
          type="submit"
          :class="[
            '!transition-all !duration-200 !ease-in-out !flex !items-center !justify-center !min-w-[60px] !px-4 !shadow-sm',
            userInput.trim() && !loading && !isInitialLoading
              ? '!bg-indigo-600 !hover:bg-indigo-700 !text-white'
              : clientSideTheme && isDark
                ? '!bg-gray-700 !text-gray-400 !cursor-not-allowed'
                : '!bg-gray-200 !text-gray-400 !cursor-not-allowed',
          ]"
          :disabled="loading || isInitialLoading || !userInput.trim()"
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
            class="!h-5 !w-5 !border-2 !border-t-transparent !border-current !rounded-full !animate-spin"
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
