<template>
  <a
    href="#"
    :class="props.linkClass"
    role="button"
    :aria-label="ariaLabel"
    @click.prevent="activateChat"
  >
    <slot>Contact</slot>
  </a>
</template>

<script lang="ts" setup>
interface Props {
  message?: string;
  linkClass?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: "How can I contact Steve?",
  linkClass: "text-blue-600 hover:text-blue-800 underline",
  ariaLabel: "Open chat to contact Steve",
});

const activateChat = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("activateChat", {
        detail: { message: props.message },
      }),
    );
  }
};
</script>
