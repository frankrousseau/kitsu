<template>
  <div class="header-menu hidden">
    <div
      role="button"
      tabindex="0"
      @click="$emit('edit-clicked')"
      @keydown.enter.prevent="$emit('edit-clicked')"
      @keydown.space.prevent="$emit('edit-clicked')"
      v-if="isEditAllowed"
    >
      {{ $t('main.edit') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('sort-by-clicked')"
      @keydown.enter.prevent="$emit('sort-by-clicked')"
      @keydown.space.prevent="$emit('sort-by-clicked')"
      v-if="showSort"
    >
      {{ $t('main.sort_by') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('toggle-stick')"
      @keydown.enter.prevent="$emit('toggle-stick')"
      @keydown.space.prevent="$emit('toggle-stick')"
      v-if="showStick"
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
      @click="$emit('delete-clicked')"
      @keydown.enter.prevent="$emit('delete-clicked')"
      @keydown.space.prevent="$emit('delete-clicked')"
      v-if="isEditAllowed"
    >
      {{ $t('main.delete') }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  isEditAllowed: {
    type: Boolean,
    default: false
  },
  isSticked: {
    type: Boolean,
    default: false
  },
  showSort: {
    type: Boolean,
    default: true
  },
  showStick: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'delete-clicked',
  'edit-clicked',
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
  width: 128px;
  box-shadow: 0 2px 6px $light-grey;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  top: 90px;
  z-index: 1001; // Needed to be above the sticky cells
}

.header-menu div {
  cursor: pointer;
}

.header-menu div {
  padding: 0.5em;
}
</style>
