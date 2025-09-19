<template>
  <a
    href="#"
    :class="computedLinkClass"
    role="button"
    :aria-label="ariaLabel"
    @click.prevent="activateChat"
  >
    <slot>Contact</slot>
  </a>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// Props interface
interface Props {
  message?: string;
  linkClass?: string;
  ariaLabel?: string;
}

// Define props with defaults and validation
const props = withDefaults(defineProps<Props>(), {
  message: "How can I contact Steve?",
  linkClass: "text-blue-600 hover:text-blue-800 underline",
  ariaLabel: "Open chat to contact Steve",
});

// Computed property for link classes
const computedLinkClass = computed((): string => {
  return props.linkClass;
});

// Event detail interface
interface ChatActivationDetail {
  message: string;
}

// Event interface
interface ChatActivationEvent extends CustomEvent<ChatActivationDetail> {
  detail: ChatActivationDetail;
}

// Type-safe event dispatcher
const activateChat = (): void => {
  if (typeof window !== "undefined") {
    const event: ChatActivationEvent = new CustomEvent("activateChat", {
      detail: {
        message: props.message,
      },
    }) as ChatActivationEvent;

    window.dispatchEvent(event);
  }
};
</script>
