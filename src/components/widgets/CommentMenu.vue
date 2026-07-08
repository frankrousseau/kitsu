<template>
  <div class="comment-menu">
    <div
      role="button"
      tabindex="0"
      @click="$emit('pin-clicked')"
      @keydown.enter.prevent="$emit('pin-clicked')"
      @keydown.space.prevent="$emit('pin-clicked')"
      v-if="isPinnable && !isEmpty"
    >
      {{ isPinned ? $t('comments.unpin') : $t('comments.pin') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('toggle-for-client-clicked')"
      @keydown.enter.prevent="$emit('toggle-for-client-clicked')"
      @keydown.space.prevent="$emit('toggle-for-client-clicked')"
      v-if="canToggleForClient"
    >
      {{ $t('comments.toggle_for_client') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('edit-clicked')"
      @keydown.enter.prevent="$emit('edit-clicked')"
      @keydown.space.prevent="$emit('edit-clicked')"
      v-if="isEditable"
    >
      {{ $t('main.edit') }}
    </div>
    <div
      role="button"
      tabindex="0"
      @click="$emit('move-clicked')"
      @keydown.enter.prevent="$emit('move-clicked')"
      @keydown.space.prevent="$emit('move-clicked')"
      v-if="canMove"
    >
      {{ $t('comments.move_to_task') }}
    </div>
    <div
      class="error"
      role="button"
      tabindex="0"
      @click="$emit('delete-clicked')"
      @keydown.enter.prevent="$emit('delete-clicked')"
      @keydown.space.prevent="$emit('delete-clicked')"
      v-if="isEditable"
    >
      {{ $t('main.delete') }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  isEditable: {
    type: Boolean,
    default: true
  },
  isEmpty: {
    type: Boolean,
    default: false
  },
  isPinnable: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  canToggleForClient: {
    type: Boolean,
    default: false
  },
  canMove: {
    type: Boolean,
    default: false
  },
  isForClient: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'delete-clicked',
  'edit-clicked',
  'move-clicked',
  'pin-clicked',
  'toggle-for-client-clicked'
])
</script>

<style lang="scss" scoped>
.dark .comment-menu {
  background-color: $dark-grey-light;
  box-shadow: 0 2px 6px $dark-grey-light;
  color: $light-grey-light;
}

.comment-menu {
  border-radius: 10px;
  position: absolute;
  background: white;
  width: 118px;
  box-shadow: 0 2px 6px $light-grey;
  top: 20px;
  left: -90px;
  z-index: 100;
  overflow: hidden;

  div {
    cursor: pointer;
    padding: 0.5em;

    &:hover {
      background-color: var(--background-alt);
    }
  }
}
</style>
