<template>
  <a
    class="attachment-image-link"
    :href="downloadHref || src"
    :title="name"
    target="_blank"
    v-if="!hasError"
  >
    <img class="attachment-image" :src="src" :alt="name" @error="onError" />
  </a>

  <div class="attachment-error" v-else>
    <image-off-icon class="attachment-error-icon" :size="18" />
    <span class="attachment-error-text">
      <span class="attachment-error-label">
        {{ $t('comments.player.image_unavailable') }}
      </span>
      <span class="attachment-error-name" v-if="name">{{ name }}</span>
    </span>
  </div>
</template>

<script setup>
import { ImageOffIcon } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps({
  src: { type: String, required: true },
  name: { type: String, default: '' },
  downloadHref: { type: String, default: '' }
})

const hasError = ref(false)

const onError = () => {
  hasError.value = true
}
</script>

<style lang="scss" scoped>
.attachment-image-link {
  display: block;
}

.attachment-image {
  border: 1px solid var(--border);
  border-radius: 8px;
  display: block;
  margin: 0.5em auto;
  max-width: 100%;
}

.attachment-error {
  align-items: center;
  background: var(--background-page);
  border: 1px solid var(--border-alt);
  border-radius: 8px;
  color: var(--text);
  display: flex;
  gap: 0.6em;
  margin: 0.5em 0;
  max-width: 32em;
  padding: 0.6em 0.8em;
}

.attachment-error-icon {
  color: var(--text-alt);
  flex-shrink: 0;
}

.dark .attachment-error {
  border-color: #565a62;
}

.dark .attachment-error-icon,
.dark .attachment-error-name {
  opacity: 0.7;
}

.attachment-error-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1em;
  margin-left: 0.3em;
  min-width: 0;
}

.attachment-error-label {
  font-size: 0.85em;
  font-weight: 600;
}

.attachment-error-name {
  color: var(--text-alt);
  font-size: 0.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
