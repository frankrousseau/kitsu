<template>
  <div class="loading-skeleton">
    <div
      class="skeleton-card timeline-entry"
      :style="{ '--row-index': i - 1 }"
      :key="`skeleton-${i}`"
      v-for="i in rows"
    >
      <span class="dot"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 6 }
})
</script>

<style lang="scss" scoped>
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  margin-top: 2em;
  padding-top: 1em;
}

.skeleton-card {
  // The pulse animates the same opacity as the entry animation, so it
  // only starts once the 0.4s fade-in is over (its 0% frame matches the
  // fade-in end value): no visible jump between the two.
  animation:
    skeleton-card-in 0.4s ease-out forwards,
    skeleton-pulse 1.6s ease-in-out infinite;
  animation-delay:
    calc(var(--row-index) * 150ms), calc(var(--row-index) * 150ms + 0.4s);
  background: rgba(var(--skeleton-rgb), 0.45);
  border-radius: 0.5em;
  height: 48px;
  opacity: 0;
  position: relative;
}

.skeleton-card .dot {
  background: $blue-light;
  border-radius: 4px;
  height: 9px;
  left: -34px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 9px;
}

.dark .skeleton-card {
  background: rgba(var(--skeleton-rgb), 0.15);
}

.dark .skeleton-card .dot {
  background: $blue;
}

@keyframes skeleton-card-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card {
    animation: none;
    opacity: 1;
  }
}
</style>
