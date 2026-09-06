<template>
  <div :class="{ flexrow: true, 'has-tabs': tabs.length }">
    <route-tabs
      class="filler header-tabs"
      :active-tab="activeTab"
      :route-key="routeKey"
      :tabs="tabs"
      v-if="tabs.length"
    />
    <page-title class="flexrow-item" :text="title" v-else />
    <div class="filler"></div>
    <button-simple
      class="flexrow-item export-button"
      icon="export"
      :title="$t('main.csv.export_file')"
      @click="$emit('export-clicked')"
      v-if="isExportable"
    />
    <button-simple
      class="flexrow-item mr0"
      icon="plus"
      :text="newEntryLabel"
      :is-responsive="true"
      @click="$emit('new-clicked')"
    />
  </div>
</template>

<script setup>
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import PageTitle from '@/components/widgets/PageTitle.vue'
import RouteTabs from '@/components/widgets/RouteTabs.vue'

defineProps({
  activeTab: {
    type: String,
    default: ''
  },
  isExportable: {
    type: Boolean,
    default: true
  },
  newEntryLabel: {
    type: String,
    default: ''
  },
  routeKey: {
    type: String,
    default: 'tab'
  },
  tabs: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

defineEmits(['export-clicked', 'new-clicked'])
</script>

<style lang="scss" scoped>
// With tabs the hairline belongs to the whole row, buttons included, so
// the tabs bar does not stop short of the actions. The tabs overlap the
// row border by one pixel: their own hairline lands on it (same color) and
// the active underline paints over it, as descendants paint above an
// ancestor's border.
.has-tabs {
  align-items: flex-end;
  border-bottom: 1px solid var(--border-alt);

  .header-tabs {
    margin-bottom: -1px;
  }

  .button {
    margin-bottom: 6px;
  }
}

@media screen and (max-width: 768px) {
  .export-button {
    display: none;
  }
}
</style>
