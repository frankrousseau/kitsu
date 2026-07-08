<template>
  <div class="header-menu hidden">
    <div
      role="button"
      tabindex="0"
      @click="$emit('minimize-clicked')"
      @keydown.enter.prevent="$emit('minimize-clicked')"
      @keydown.space.prevent="$emit('minimize-clicked')"
    >
      <span v-if="isMinimized">
        {{ $t('main.maximize') }}
      </span>
      <span v-else>{{ $t('main.minimize') }}</span>
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('sort-by-clicked')"
      @keydown.enter.prevent="$emit('sort-by-clicked')"
      @keydown.space.prevent="$emit('sort-by-clicked')"
    >
      {{ $t('main.sort_by') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('select-column')"
      @keydown.enter.prevent="$emit('select-column')"
      @keydown.space.prevent="$emit('select-column')"
    >
      {{ $t('main.select_column') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('toggle-stick')"
      @keydown.enter.prevent="$emit('toggle-stick')"
      @keydown.space.prevent="$emit('toggle-stick')"
    >
      <template v-if="isSticked">
        {{ $t('main.unstick') }}
      </template>
      <template v-else>
        {{ $t('main.stick') }}
      </template>
    </div>
    <div
      class="error"
      role="button"
      tabindex="0"
      @click="$emit('delete-all-clicked')"
      @keydown.enter.prevent="$emit('delete-all-clicked')"
      @keydown.space.prevent="$emit('delete-all-clicked')"
      v-if="isEditAllowed"
    >
      {{ $t('main.delete_all') }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  isMinimized: {
    type: Boolean,
    default: false
  },
  isEditAllowed: {
    type: Boolean,
    default: false
  },
  isSticked: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'delete-all-clicked',
  'minimize-clicked',
  'select-column',
  'sort-by-clicked',
  'toggle-stick'
])
</script>

<style lang="scss" scoped>
.dark .header-menu {
  background-color: $dark-grey-light;
  box-shadow: 0 2px 6px $dark-grey-light;
}

.header-menu {
  position: absolute;
  background: white;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  box-shadow: 0 2px 6px $light-grey;
  top: 90px;
  width: 118px;
  z-index: 100;
}

.header-menu div {
  cursor: pointer;
}

.header-menu div {
  padding: 0.5em;
}
</style>
