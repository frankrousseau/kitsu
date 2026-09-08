<template>
  <div class="empty-placeholder">
    <component :is="icon" :size="40" />
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: [Object, Function], required: true },
  text: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
.empty-placeholder {
  align-items: center;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  opacity: 0.55;
  padding: 2em 1em 0;
  text-align: center;

  p {
    margin: 0;
    max-width: 40ch;
  }
}
</style>
