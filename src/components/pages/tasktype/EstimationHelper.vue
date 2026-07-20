<template>
  <div class="estimation-wrapper">
    <div class="estimation-helper columns">
      <div class="task-list column datatable-wrapper">
        <table class="datatable">
          <thead class="datatable-head">
            <tr>
              <th class="assignees">
                {{ $t('tasks.fields.assignees') }}
              </th>
              <th class="thumbnail"></th>
              <th class="asset-type" v-if="isAssets">
                {{ $t('tasks.fields.asset_type') }}
              </th>
              <th class="sequence" v-else-if="isShots">
                {{ $t('tasks.fields.sequence') }}
              </th>
              <th class="name">
                {{ $t('tasks.fields.entity_name') }}
              </th>
              <th class="frames numeric-cell" v-if="isShots">
                {{ $t('tasks.fields.frames') }}
              </th>
              <th class="seconds numeric-cell" v-if="isShots">
                {{ $t('tasks.fields.seconds').substring(0, 3) }}.
              </th>
              <th class="estimation numeric-cell">
                {{ $t('tasks.fields.estimation').substring(0, 3) }}.
              </th>
            </tr>
          </thead>

          <tbody class="datatable-body">
            <tr
              :key="task.id"
              :class="{
                'datatable-row': true,
                selected: selectionGrid[task.id],
                'task-line': true
              }"
              v-for="(task, index) in tasksByPerson"
            >
              <td class="assignees">
                <span class="flexrow" v-if="task.assignees.length">
                  <span
                    class="flexrow"
                    :key="`${task.id}-${personId}`"
                    v-for="personId in task.assignees"
                  >
                    <people-avatar
                      class="flexrow-item"
                      :person="personMap.get(personId)"
                      :size="30"
                      :font-size="17"
                    />
                    <people-name
                      class="flexrow-item"
                      :person="personMap.get(personId)"
                      v-if="task.assignees.length === 1"
                    />
                  </span>
                </span>
              </td>
              <td class="thumbnail">
                <entity-thumbnail
                  :entity="getEntity(task.entity.id)"
                  :width="50"
                  :height="33"
                  :empty-width="50"
                  :empty-height="31"
                />
              </td>
              <td class="asset-type" v-if="isAssets">
                {{ getEntity(task.entity.id).asset_type_name }}
              </td>
              <td class="sequence" v-else-if="isShots">
                {{ getEntity(task.entity.id).sequence_name }}
              </td>
              <td class="name">
                {{ getEntity(task.entity.id).name }}
              </td>
              <td class="frames numeric-cell" v-if="isShots">
                {{ getEntity(task.entity.id).nb_frames }}
              </td>
              <td class="frames numeric-cell" v-if="isShots">
                {{ getSeconds(task) }}
              </td>
              <td
                role="button"
                tabindex="0"
                @click="selectTask($event, task, index)"
                @keydown.enter.prevent="selectTask($event, task, index)"
                class="estimation numeric-cell"
              >
                <input
                  :ref="el => setEstimationInput(task.id, el)"
                  class="input stylehidden"
                  min="0"
                  step="any"
                  type="number"
                  @blur="onInputBlur"
                  @change="estimationUpdated($event, task, index)"
                  @keydown="onKeyDown"
                  @mouseout="onInputMouseOut"
                  @mouseover="onInputMouseOver"
                  :value="formatDuration(task.estimation, false)"
                  v-if="isInDepartment(task)"
                />
                <span v-else>
                  {{ formatDuration(task.estimation) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="person-list column datatable-wrapper">
        <table class="datatable">
          <thead class="datatable-head">
            <tr>
              <th class="assignees">
                {{ $t('tasks.fields.assignees') }}
              </th>
              <th class="count numeric-cell">
                {{ $t('tasks.fields.count') }}
              </th>
              <th class="frames numeric-cell">
                {{ $t('tasks.fields.frames') }}
              </th>
              <th class="seconds numeric-cell">
                {{ $t('tasks.fields.seconds').substring(0, 3) }}.
              </th>
              <th class="estimation numeric-cell">
                {{ $t('tasks.fields.estimation').substring(0, 3) }}.
              </th>
              <th class="quota numeric-cell">
                {{
                  $t('tasks.fields.estimated_quota') +
                  ' ' +
                  $t('tasks.fields.seconds').substring(0, 3)
                }}.
              </th>
              <th class="quota numeric-cell">
                {{
                  $t('tasks.fields.estimated_quota') +
                  ' ' +
                  $t('tasks.fields.frames').substring(0, 3)
                }}.
              </th>
              <th class="quota numeric-cell">
                {{
                  $t('tasks.fields.estimated_quota') +
                  ' ' +
                  $t('tasks.fields.count')
                }}.
              </th>
            </tr>
          </thead>

          <tbody class="datatable-body">
            <template v-for="person in assignees" :key="person.id">
              <tr class="datatable-row task-line">
                <td class="person flexrow">
                  <people-avatar
                    class="flexrow-item"
                    :person="person"
                    :size="30"
                    :font-size="17"
                  />
                  <people-name class="flexrow-item" :person="person" />
                </td>
                <td class="count numeric-cell">
                  {{ person.alltasks.count }}
                </td>
                <td class="frames numeric-cell">
                  {{ person.alltasks.frames }}
                </td>
                <td class="seconds numeric-cell">
                  {{ person.alltasks.seconds }}
                </td>
                <td class="estimation numeric-cell">
                  {{ person.alltasks.estimation }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.alltasks.quota }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.alltasks.quotaFrames }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.alltasks.quotaCount }}
                </td>
              </tr>
              <tr class="datatable-row task-line">
                <td class="person flexrow">
                  <corner-down-right-icon class="ml05 mr05" :size="12" />
                  {{ $t('main.remaining') }}
                </td>
                <td class="count numeric-cell">
                  {{ person.remaining.count }}
                </td>
                <td class="frames numeric-cell">
                  {{ person.remaining.frames }}
                </td>
                <td class="seconds numeric-cell">
                  {{ person.remaining.seconds }}
                </td>
                <td class="estimation numeric-cell">
                  {{ person.remaining.estimation }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.remaining.quota }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.remaining.quotaFrames }}
                </td>
                <td class="quota numeric-cell">
                  {{ person.remaining.quotaCount }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
// Imports
import { CornerDownRightIcon } from 'lucide-vue-next'
import { firstBy } from 'thenby'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

import {
  focusInput,
  onInputBlur,
  onInputMouseOut,
  onInputMouseOver,
  pauseEvent
} from '@/composables/dom'
import { useFormat } from '@/composables/format'
import { minutesToDays, range } from '@/lib/time'
import { frameToSeconds } from '@/lib/video'
import assetsStore from '@/store/modules/assets.js'
import editsStore from '@/store/modules/edits.js'
import episodesStore from '@/store/modules/episodes.js'
import sequencesStore from '@/store/modules/sequences.js'
import shotsStore from '@/store/modules/shots.js'

import EntityThumbnail from '@/components/widgets/EntityThumbnail.vue'
import PeopleAvatar from '@/components/widgets/PeopleAvatar.vue'
import PeopleName from '@/components/widgets/PeopleName.vue'

// Composables
const store = useStore()
const { formatDuration, organisation } = useFormat()

// Props / Emits
const props = defineProps({
  entityType: {
    type: String,
    default: 'Asset'
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['estimation-changed'])

// State
const lastSelection = ref(0)
const lastShiftSelection = ref(0)
const selectionGrid = ref({})
// Imperative focus targets only, no reactivity needed
const estimationInputs = new Map()

// Computed
const currentProduction = computed(() => store.getters.currentProduction)
const isCurrentUserManager = computed(() => store.getters.isCurrentUserManager)
const isCurrentUserSupervisor = computed(
  () => store.getters.isCurrentUserSupervisor
)
const personMap = computed(() => store.getters.personMap)
const taskStatusMap = computed(() => store.getters.taskStatusMap)
const taskTypeMap = computed(() => store.getters.taskTypeMap)
const user = computed(() => store.getters.user)

const isAssets = computed(() => props.entityType === 'Asset')
const isShots = computed(() => props.entityType === 'Shot')

const entityMap = computed(() => {
  const caches = {
    asset: assetsStore.cache.assetMap,
    edit: editsStore.cache.editMap,
    episode: episodesStore.cache.episodeMap,
    sequence: sequencesStore.cache.sequenceMap,
    shot: shotsStore.cache.shotMap
  }
  return caches[props.entityType.toLowerCase()]
})

const tasksByPerson = computed(() =>
  [...props.tasks].sort(compareFirstAssignees)
)

const assignees = computed(() => {
  const alltasks = {
    countMap: new Map(),
    frameMap: new Map(),
    estimationMap: new Map(),
    secondMap: new Map()
  }
  const remaining = {
    countMap: new Map(),
    frameMap: new Map(),
    estimationMap: new Map(),
    secondMap: new Map()
  }
  const assigneeSet = new Set()
  props.tasks.forEach(task => {
    const entity = getEntity(task.entity_id)
    task.assignees.forEach(personId => {
      assigneeSet.add(personId)
      addAssigneeStatsToMaps(alltasks, personId, task, entity)
      const status = taskStatusMap.value.get(task.task_status_id)
      if (!status.is_done && !status.is_feedback_request) {
        addAssigneeStatsToMaps(remaining, personId, task, entity)
      }
    })
  })
  return [...assigneeSet]
    .map(personId => personMap.value.get(personId))
    .sort(firstBy('name'))
    .map(person => ({
      ...person,
      alltasks: getAssigneeStats(person, alltasks),
      remaining: getAssigneeStats(person, remaining)
    }))
})

// Functions
const getEntity = entityId => entityMap.value.get(entityId)

const setEstimationInput = (taskId, el) => {
  if (el) {
    estimationInputs.set(taskId, el)
  } else {
    estimationInputs.delete(taskId)
  }
}

const compareFirstAssignees = (a, b) => {
  if (a.assignees.length > 0 && b.assignees.length > 0) {
    const personA = personMap.value.get(a.assignees[0])
    const personB = personMap.value.get(b.assignees[0])
    return personA.name.localeCompare(personB.name)
  } else if (a.assignees.length > 0) {
    return -1
  } else if (b.assignees.length > 0) {
    return 1
  } else {
    return -1
  }
}

const getSeconds = task => {
  const shot = getEntity(task.entity_id)
  return frameToSeconds(shot.nb_frames, currentProduction.value, shot)
}

const estimationUpdated = (event, task) => {
  const value = event.target.value
  if (value && value.length > 0) {
    saveEstimations(parseFloat(value), task)
  }
}

const saveEstimations = (days, task) => {
  const selection = Object.keys(selectionGrid.value)
  if (selection.length > 1) {
    selection.forEach(taskId => {
      emit('estimation-changed', { taskId, days })
    })
  } else {
    emit('estimation-changed', { taskId: task.id, days })
  }
}

const onKeyDown = event => {
  if (event.key === 'Tab') {
    pauseEvent(event)
    if (event.shiftKey) {
      selectPrevious()
    } else {
      selectNext()
    }
  } else if (event.key === 'ArrowDown') {
    pauseEvent(event)
    selectNext(event.shiftKey)
  } else if (event.key === 'ArrowUp') {
    pauseEvent(event)
    selectPrevious(event.shiftKey)
  }
}

const clearSelection = () => {
  selectionGrid.value = {}
}

const addToSelection = taskId => {
  selectionGrid.value[taskId] = true
}

const selectTask = (event, task, index) => {
  if (!(event.ctrlKey || event.metaKey)) clearSelection()
  if (event.shiftKey) {
    selectTaskRange(index)
  } else {
    selectSingleTask(index)
  }
  if (isInDepartment(task)) {
    focusInput(estimationInputs.get(tasksByPerson.value[index].id))
  }
}

const selectPrevious = shiftKey => {
  const index =
    lastSelection.value - 1 < 0
      ? tasksByPerson.value.length - 1
      : lastSelection.value - 1
  selectTask({ shiftKey }, tasksByPerson.value[index], index)
}

const selectNext = shiftKey => {
  const index =
    lastSelection.value + 1 >= tasksByPerson.value.length
      ? 0
      : lastSelection.value + 1
  selectTask({ shiftKey }, tasksByPerson.value[index], index)
}

const selectSingleTask = index => {
  addToSelection(tasksByPerson.value[index].id)
  lastSelection.value = index
  lastShiftSelection.value = index
}

const selectTaskRange = index => {
  lastSelection.value = index
  const taskIndices =
    lastShiftSelection.value > index
      ? range(index, lastShiftSelection.value)
      : range(lastShiftSelection.value, index)
  taskIndices.forEach(i => {
    addToSelection(tasksByPerson.value[i].id)
  })
}

const isInDepartment = task => {
  if (isCurrentUserManager.value) {
    return true
  } else if (isCurrentUserSupervisor.value) {
    if (user.value.departments.length === 0) {
      return true
    }
    const taskType = taskTypeMap.value.get(task.task_type_id)
    return (
      taskType.department_id &&
      user.value.departments.includes(taskType.department_id)
    )
  }
  return false
}

const getAssigneeStats = (person, maps) => {
  const estimation = maps.estimationMap.get(person.id) || 0
  const seconds = maps.secondMap.get(person.id) || 0
  const frames = maps.frameMap.get(person.id) || 0
  const count = maps.countMap.get(person.id) || 0
  const estimationDays = minutesToDays(organisation.value, estimation)
  const quota = estimation > 0 ? seconds / estimationDays : 0
  const quotaCount = estimation > 0 ? count / estimationDays : 0
  const quotaFrames = estimation > 0 ? frames / estimationDays : 0

  return {
    count,
    estimation: formatDuration(estimation),
    frames,
    quota: quota.toFixed(2),
    quotaFrames: quotaFrames.toFixed(2),
    quotaCount: quotaCount.toFixed(2),
    seconds: seconds.toFixed(2)
  }
}

const addAssigneeStatsToMaps = (maps, personId, task, entity) => {
  maps.countMap.set(personId, (maps.countMap.get(personId) || 0) + 1)
  maps.estimationMap.set(
    personId,
    (maps.estimationMap.get(personId) || 0) + task.estimation
  )
  if (!isAssets.value) {
    const frames = entity.nb_frames || 0
    const seconds = frameToSeconds(frames, currentProduction.value, entity)
    maps.secondMap.set(personId, (maps.secondMap.get(personId) || 0) + seconds)
    maps.frameMap.set(personId, (maps.frameMap.get(personId) || 0) + frames)
  }
}
</script>

<style lang="scss" scoped>
th {
  padding: 0.4em 0;
}

td {
  padding: 0 0.4em;

  &.thumbnail {
    padding-top: 0.2em;
  }

  &.assignees {
    padding-left: 0.4em;
    padding-top: 0.2em;
  }
}

.assignees {
  min-width: 200px;
  max-width: 200px;
  width: 200px;

  span {
    margin-top: 0.2em;
    margin-bottom: 0.2em;
  }
}

.thumbnail {
  vertical-align: middle;
  min-width: 64px;
  max-width: 64px;
  width: 64px;
}

.asset-type {
  min-width: 120px;
  width: 120px;
}

.sequence {
  min-width: 120px;
  width: 120px;
}

.name {
  min-width: 120px;
  width: 100%;
  font-weight: bold;
}

.frames,
.estimation,
.seconds,
.count {
  min-width: 60px;
  width: 60px;
}

.estimation-helper {
  max-height: 100%;
}

.estimation-wrapper {
  flex: 1;
}

.columns {
  margin-top: 1em;
}

.column {
  padding: 0 1em 1em 1em;
}

.task-list .numeric-cell,
.person-list .numeric-cell {
  padding-right: 0.4em;
  text-align: right;

  input {
    text-align: right;
  }
}
.task-list .numeric-cell input.input {
  padding-right: 0.5em;
}

.person-list {
  flex: 1;

  td {
    padding: 0.2em;
  }
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
