<template>
  <div class="loading-dots" :class="size">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  }
})
</script>

<style scoped lang="scss">
.loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;

  &.small {
    .dot {
      width: 4px;
      height: 4px;
    }
  }

  &.medium {
    .dot {
      width: 6px;
      height: 6px;
    }
  }

  &.large {
    .dot {
      width: 8px;
      height: 8px;
    }
  }
}

.dot {
  background-color: #909399;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
