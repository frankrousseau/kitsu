<template>
  <div class="flexrow field-header">
    <span class="flexrow-item">
      <slot>{{ label }}</slot>
    </span>
    <span
      class="asset-field-menu-button header-icon pointer"
      role="button"
      tabindex="0"
      @click="showMenu"
      @keydown.enter.prevent="showMenu"
      @keydown.space.prevent="showMenu"
    >
      <chevron-down-icon :size="14" />
    </span>
    <slot name="actions" />
  </div>
</template>

<script setup>
import { ChevronDownIcon } from 'lucide-vue-next'

const props = defineProps({
  fieldName: { type: String, required: true },
  label: { type: String, default: '' }
})

const emit = defineEmits(['show-menu'])

const showMenu = event => {
  emit('show-menu', props.fieldName, event)
}
</script>
