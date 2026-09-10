<template>
  <div class="mt1 wrapper time-logs">
    <div class="has-text-centered" v-if="isLoading">
      <spinner />
    </div>
    <div v-else-if="logs.length > 0">
      <table class="datatable datatable--cards">
        <thead class="datatable-head">
          <tr class="datatable-row-header">
            <th class="date">
              {{ $t('main.date') }}
            </th>
            <th class="person">
              {{ $t('main.person') }}
            </th>
            <th class="type">
              {{ $t('entities.preview_files.task_type') }}
            </th>
            <th class="duration">
              {{ $t('tasks.fields.duration') }}
            </th>
            <th class="end-cell"></th>
          </tr>
        </thead>
      </table>
      <table class="datatable datatable--cards">
        <tbody class="datatable-body">
          <tr :key="log.id" class="datatable-row" v-for="log in logs">
            <td class="date" :data-label="$t('main.date')">
              {{ formatDisplayDate(log.date) }}
            </td>
            <people-name-cell
              class="person"
              :data-label="$t('main.person')"
              :person="personMap.get(log.person_id)"
            />
            <task-type-cell
              class="type card-head"
              :task-type="getTaskType(log)"
              :production-id="currentProduction.id"
            />
            <td class="duration" :data-label="$t('tasks.fields.duration')">
              {{ formatDuration(log.duration) }}
            </td>
            <td class="end-cell"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <empty-section
      :icon="ClockIcon"
      :text="$t('entities.logs.no_logs')"
      v-else
    />
  </div>
</template>

<script setup>
import { ClockIcon } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

import { useFormat } from '@/composables/format'

/* eslint-disable no-unused-vars */
import PeopleNameCell from '@/components/cells/PeopleNameCell.vue'
import TaskTypeCell from '@/components/cells/TaskTypeCell.vue'
import EmptySection from '@/components/widgets/EmptySection.vue'
import Spinner from '@/components/widgets/Spinner.vue'
/* eslint-enable no-unused-vars */

const store = useStore()
const { formatDisplayDate, formatDuration } = useFormat()

// Props
// --------------------------------------------------------------------------
const props = defineProps({
  entity: { type: Object, default: null }
})

// State
// --------------------------------------------------------------------------
const isLoading = ref(false)
const logs = ref([])

// Computed
// --------------------------------------------------------------------------
const currentProduction = computed(() => store.getters.currentProduction)
const personMap = computed(() => store.getters.personMap)
const taskMap = computed(() => store.getters.taskMap)
const taskTypeMap = computed(() => store.getters.taskTypeMap)

// Functions
// --------------------------------------------------------------------------
const getTaskType = log => {
  const task = taskMap.value.get(log.task_id)
  return task && taskTypeMap.value.get(task.task_type_id)
}

const reset = async () => {
  isLoading.value = true
  try {
    logs.value = await store.dispatch('getEntityTimeLogs', props.entity.id)
  } catch (err) {
    console.error(err)
    logs.value = []
  }
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
.date {
  width: 100px;
  white-space: nowrap;
}
.person {
  width: 200px;
}
.type {
  width: 150px;
}
.duration {
  width: 50px;
}

.time-logs {
  overflow-y: auto;
}

.dark .wrapper.time-logs {
  background: transparent;
}

.datatable-row-header::after {
  display: none;
}
</style>
