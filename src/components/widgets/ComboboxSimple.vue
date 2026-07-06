<template>
  <div class="field">
    <label class="label" v-if="label.length > 0">
      {{ label }}
    </label>
    <div class="flexrow" role="radiogroup" :aria-label="label || undefined">
      <span
        :ref="el => (choiceRefs[index] = el)"
        :key="option.label"
        :class="{
          choice: true,
          'flexrow-item': true,
          selected: selectedOption.value === option.value
        }"
        role="radio"
        :aria-checked="selectedOption.value === option.value"
        :tabindex="selectedOption.value === option.value ? 0 : -1"
        @click="selectOption(option)"
        @keydown="onChoiceKeydown($event, index)"
        v-for="(option, index) in options"
      >
        {{ getOptionLabel(option) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  label: {
    default: '',
    type: String
  },
  options: {
    default: () => [],
    type: Array
  },
  modelValue: {
    default: '',
    type: String
  },
  localeKeyPrefix: {
    default: '',
    type: String
  }
})

const emit = defineEmits(['update:model-value'])

const selectedOption = ref({
  label: '',
  value: ''
})

const selectOption = option => {
  emit('update:model-value', option.value)
  selectedOption.value = option
}

// ComboboxSimple has no open/close popup (all choices are always visible),
// so it uses a plain roving-tabindex radiogroup instead of
// useComboboxKeyboard: arrow keys both move and select, like a native
// <input type="radio"> group.
const choiceRefs = ref([])

const onChoiceKeydown = (event, index) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectOption(props.options[index])
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      focusChoiceAt(Math.min(index + 1, props.options.length - 1))
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      focusChoiceAt(Math.max(index - 1, 0))
      break
  }
}

const focusChoiceAt = index => {
  const option = props.options[index]
  if (!option) return
  selectOption(option)
  nextTick(() => choiceRefs.value[index]?.focus())
}

const getOptionLabel = option => {
  if (props.localeKeyPrefix && option.label) {
    return t(props.localeKeyPrefix + option.label.toLowerCase())
  }
  return option.label
}

const resetOptions = () => {
  if (props.options.length > 0) {
    const option = props.options.find(o => o.value === props.modelValue)
    if (option) {
      selectedOption.value = option
    } else {
      selectedOption.value = props.options[0]
    }
  }
}

onMounted(() => {
  resetOptions()
})

watch(
  () => props.options,
  () => {
    resetOptions()
  }
)

watch(
  () => props.modelValue,
  () => {
    resetOptions()
  }
)
</script>

<style lang="scss" scoped>
.choice {
  align-items: center;
  border: 2px solid var(--border);
  border-radius: 25px;
  color: $grey;
  cursor: pointer;
  display: inline-block;
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.5em 1.2em;
  text-transform: uppercase;
  transition: 0.3s ease all;

  &.selected {
    color: $light-green;
    border: 2px solid $light-green;
  }
}
</style>
