<template>
  <div class="flexrow">
    <people-avatar
      :is-link="false"
      :person="item"
      :size="30"
      :font-size="14"
      class="flexrow-item"
    />
    <span class="flexrow-item">
      <template v-for="(part, index) in labelParts" :key="index">
        <b v-if="part.match">{{ part.text }}</b>
        <template v-else>{{ part.text }}</template>
      </template>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import PeopleAvatar from '@/components/widgets/PeopleAvatar.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  search: {
    type: String
  }
})

const regExpEscape = string => {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
}

// Split the name into plain/matching segments so the template can bold
// matches through interpolation — never inject the name as HTML.
const labelParts = computed(() => {
  const text = props.item.name.trim()
  const search = props.search?.trim()
  if (!search) return [{ text, match: false }]
  const lowerSearch = search.toLowerCase()
  return text
    .split(RegExp(`(${regExpEscape(search)})`, 'gi'))
    .filter(part => part)
    .map(part => ({ text: part, match: part.toLowerCase() === lowerSearch }))
})
</script>
