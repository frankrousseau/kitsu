<template>
  <div class="mt1 flexcolumn wrapper output-files">
    <div class="has-text-centered" v-if="isLoading">
      <spinner />
    </div>
    <div v-else-if="outputFiles.length > 0">
      <table class="datatable">
        <thead class="datatable-head">
          <tr class="datatable-row-header">
            <th class="tasktype">
              {{ $t('entities.output_files.task_type') }}
            </th>
            <th class="type">
              {{ $t('entities.output_files.type') }}
            </th>
            <th class="name">
              {{ $t('entities.output_files.name') }}
            </th>
            <th class="extension">
              {{ $t('entities.output_files.extension') }}
            </th>
            <th class="revision">
              {{ $t('entities.output_files.revision') }}
            </th>
            <th class="size">
              {{ $t('entities.output_files.size') }}
            </th>
            <th class="status">
              {{ $t('entities.output_files.status') }}
            </th>
            <th class="person">
              {{ $t('entities.output_files.person') }}
            </th>
            <th class="end-cell"></th>
          </tr>
        </thead>
        <tbody class="datatable-body">
          <template v-for="outputFile in outputFiles" :key="outputFile.id">
            <tr class="datatable-row">
              <task-type-cell
                class="type"
                :task-type="getTaskType(outputFile)"
                :production-id="currentProduction.id"
              />
              <td class="type">
                {{ getOutputType(outputFile).name }}
              </td>
              <td class="name">
                {{ outputFile.name }}
              </td>
              <td class="extension">
                {{ outputFile.extension }}
              </td>
              <td class="revision">
                {{ outputFile.revision }}
              </td>
              <td class="size">
                {{ renderFileSize(outputFile.file_size) }}
              </td>
              <td class="status">
                {{ getFileStatus(outputFile).name }}
              </td>
              <people-name-cell
                class="person"
                :person="personMap.get(outputFile.person_id)"
              />
              <td class="end-cell"></td>
            </tr>
            <tr class="datatable-row" v-if="outputFile.path">
              <td colspan="10">
                {{ outputFile.path }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>
      {{ $t('entities.output_files.no_output_files') }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

import { renderFileSize } from '@/lib/render'

/* eslint-disable no-unused-vars */
import PeopleNameCell from '@/components/cells/PeopleNameCell.vue'
import TaskTypeCell from '@/components/cells/TaskTypeCell.vue'
import Spinner from '@/components/widgets/Spinner.vue'
/* eslint-enable no-unused-vars */

const store = useStore()

// Props
// --------------------------------------------------------------------------
const props = defineProps({
  entity: { type: Object, default: null }
})

// State
// --------------------------------------------------------------------------
const isLoading = ref(false)
const outputFiles = ref([])

// Computed
// --------------------------------------------------------------------------
const currentProduction = computed(() => store.getters.currentProduction)
const fileStatusMap = computed(() => store.getters.fileStatusMap)
const outputFileTypeMap = computed(() => store.getters.outputFileTypeMap)
const personMap = computed(() => store.getters.personMap)
const taskTypeMap = computed(() => store.getters.taskTypeMap)

// Functions
// --------------------------------------------------------------------------
const getTaskType = outputFile => taskTypeMap.value.get(outputFile.task_type_id)

const getFileStatus = outputFile =>
  fileStatusMap.value.get(outputFile.file_status_id)

const getOutputType = outputFile =>
  outputFileTypeMap.value.get(outputFile.output_type_id)

const reset = async () => {
  isLoading.value = true
  if (fileStatusMap.value.size === 0) {
    await store.dispatch('loadFileStatuses')
  }
  if (outputFileTypeMap.value.size === 0) {
    await store.dispatch('loadOutputTypes')
  }
  outputFiles.value = await store.dispatch(
    'loadEntityOutputFiles',
    props.entity.id
  )
  isLoading.value = false
}

// Watchers
// --------------------------------------------------------------------------
watch(
  () => props.entity,
  () => {
    if (props.entity) reset()
  }
)

// Lifecycle
// --------------------------------------------------------------------------
onMounted(() => {
  if (props.entity) reset()
})
</script>

<style lang="scss" scoped>
.datatable-body {
  overflow-y: auto;
}
table.datatable {
  table-layout: fixed;
}

td.type {
  width: 100px;
}
.revision {
  width: 80px;
}
.extension {
  width: 80px;
}
.size {
  width: 50px;
}
.status {
  width: 120px;
}
.name {
  width: 250px;
}
.person {
  width: 250px;
}

.output-files {
  overflow-y: auto;
}

.output-thumbnail {
  cursor: pointer;
  border-radius: 4px;
}

.datatable-row-header::after {
  display: none;
}

.empty {
  font-style: italic;
}
</style>
