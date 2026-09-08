<template>
  <div class="columns fixed-page edit xyz-in" xyz="fade">
    <div class="page column main-column">
      <div class="page-header flexrow flexrow-item">
        <div class="flexrow block mb0 main-block">
          <router-link
            class="flexrow-item has-text-centered back-link"
            :to="editsPath"
          >
            <corner-left-up-icon />
          </router-link>
          <span class="flexrow-item">
            <entity-thumbnail
              class="entity-thumbnail"
              :entity="currentEdit"
              :empty-height="60"
              :empty-width="100"
              :height="60"
              :width="100"
              v-if="currentEdit"
            />
          </span>
          <div class="entity-title flexrow-item mr1">
            {{ title }}
          </div>
          <div
            class="flexrow-item has-text-centered"
            :key="currentEdit.id"
            v-if="!isLoading && currentEdit"
          >
            <previews-per-task-type
              :entity="currentEdit"
              @preview-changed="onPreviewChanged"
            />
          </div>
        </div>
        <div class="filler"></div>
        <router-link
          class="flexrow-item has-text-centered back-link ml1"
          :to="previousEntityPath"
          v-if="previousEntityPath && entityList.length > 1"
        >
          <chevron-left-icon />
        </router-link>
        <router-link
          class="flexrow-item has-text-centered back-link"
          :to="nextEntityPath"
          v-if="nextEntityPath && entityList.length > 1"
        >
          <chevron-right-icon />
        </router-link>
      </div>

      <div class="edit player block">
        <preview-player
          ref="player"
          v-if="!isLoading && currentEdit"
          canvas-id="edit-annotation-canvas"
          :previews="currentRevisions"
          :task="currentTask"
          :entity-preview-files="previewFiles"
          :task-type-map="taskTypeMap"
          entity-type="Edit"
          :last-preview-files="currentRevisions"
          :show-comments-button="true"
          @annotation-changed="onAnnotationChanged"
          @change-current-preview="onChangeCurrentPreview"
        />
      </div>

      <div class="edit-data block">
        <route-section-tabs
          class="section-tabs"
          :active-tab="currentSection"
          :route="route"
          :tabs="editTabs"
        />

        <div class="flexrow mt1" v-if="currentSection === 'schedule'">
          <span class="flexrow-item mt05">
            {{ $t('schedule.zoom_level') }}:
          </span>
          <combobox-number
            class="zoom-level flexrow-item"
            is-simple
            :options="zoomOptions"
            v-model="zoomLevel"
          />
        </div>

        <div class="flexcolumn infos" v-show="currentSection === 'infos'">
          <page-subtitle :text="$t('edits.tasks')" />
          <entity-task-list
            class="task-list"
            :entries="currentTasks"
            :is-loading="!currentEdit"
            :is-error="false"
            :selected-task-id="selectedTask?.id"
            @task-selected="onTaskSelected"
          />
          <div class="flexrow">
            <page-subtitle :text="$t('main.info')" />
            <div class="filler"></div>
            <div class="flexrow-item has-text-right">
              <button-simple
                icon="edit"
                :title="$t('edits.edit_title')"
                @click="modals.edit = true"
                v-if="isCurrentUserManager"
              />
            </div>
          </div>

          <div class="table-body edit-metadata">
            <table class="datatable no-header" v-if="currentEdit">
              <tbody class="datatable-body">
                <tr class="datatable-row">
                  <td class="field-label">
                    {{ $t('edits.fields.description') }}
                  </td>
                  <description-cell :entry="currentEdit" :full="true" />
                </tr>
                <tr
                  :key="descriptor.id"
                  class="datatable-row"
                  v-for="descriptor in editMetadataDescriptors"
                >
                  <td class="field-label">{{ descriptor.name }}</td>
                  <td>
                    <metadata-value
                      :descriptor="descriptor"
                      :entity="currentEdit"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="schedule mt1"
          v-if="scheduleItems[0]?.children.length > 0"
          v-show="currentSection === 'schedule'"
        >
          <div class="wrapper">
            <schedule
              ref="scheduleWidget"
              :start-date="tasksStartDate"
              :end-date="tasksEndDate"
              :hierarchy="scheduleItems"
              :zoom-level="zoomLevel"
              :is-loading="false"
              :is-estimation-linked="true"
              :hide-root="true"
              :with-milestones="false"
              @item-changed="saveTaskScheduleItem"
              @estimation-changed="event => saveTaskScheduleItem(event.item)"
            />
          </div>
        </div>
        <empty-section
          :icon="CalendarIcon"
          :text="$t('main.empty_schedule')"
          v-else-if="currentSection === 'schedule'"
        />

        <entity-preview-files
          :entity="currentEdit"
          v-if="currentSection === 'preview-files'"
        />

        <entity-news
          :entity="currentEdit"
          v-if="currentSection === 'activity'"
        />

        <entity-time-logs
          :entity="currentEdit"
          v-if="currentSection === 'time-logs'"
        />
      </div>
    </div>

    <edit-edit-modal
      :active="modals.edit"
      :is-loading="isLoading"
      :is-error="errors.edit"
      :edit-to-edit="currentEdit"
      @cancel="modals.edit = false"
      @confirm="confirmEditEdit"
    />
  </div>
</template>

<script setup>
// Imports
// --------------------------------------------------------------------------
import { useHead } from '@unhead/vue'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerLeftUpIcon
} from 'lucide-vue-next'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  useTemplateRef,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { useEntity } from '@/composables/entity'
import { getEntitiesPath } from '@/lib/path'
import editStore from '@/store/modules/edits'

import DescriptionCell from '@/components/cells/DescriptionCell.vue'
import EntityTaskList from '@/components/lists/EntityTaskList.vue'
import EditEditModal from '@/components/modals/EditEditModal.vue'
import EntityNews from '@/components/pages/entities/EntityNews.vue'
import EntityPreviewFiles from '@/components/pages/entities/EntityPreviewFiles.vue'
import EntityTimeLogs from '@/components/pages/entities/EntityTimeLogs.vue'
import PreviewsPerTaskType from '@/components/players/bars/PreviewsPerTaskType.vue'
import PreviewPlayer from '@/components/players/players/PreviewPlayer.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import ComboboxNumber from '@/components/widgets/ComboboxNumber.vue'
import EmptySection from '@/components/widgets/EmptySection.vue'
import EntityThumbnail from '@/components/widgets/EntityThumbnail.vue'
import MetadataValue from '@/components/widgets/MetadataValue.vue'
import PageSubtitle from '@/components/widgets/PageSubtitle.vue'
import RouteSectionTabs from '@/components/widgets/RouteSectionTabs.vue'
import Schedule from '@/components/widgets/Schedule.vue'

defineOptions({ name: 'edit' })

// Composables
// --------------------------------------------------------------------------
const { t } = useI18n()
const route = useRoute()
const store = useStore()
const socket = getCurrentInstance().appContext.config.globalProperties.$socket
const playerRef = useTemplateRef('player')

// State
// --------------------------------------------------------------------------
const currentEdit = ref(null)
const currentPreviewFile = ref(null)
const isLoading = ref(true)
const previewFiles = ref({})
const scheduleWidget = ref(null)
const errors = reactive({ edit: false })
const modals = reactive({ edit: false })

// AddComment, inside the player's TaskInfo, injects the page-level draft
const draftComment = reactive({})
provide('draftComment', draftComment)

// Computed
// --------------------------------------------------------------------------
const currentEpisode = computed(() => store.getters.currentEpisode)
const currentProduction = computed(() => store.getters.currentProduction)
const editMetadataDescriptors = computed(
  () => store.getters.editMetadataDescriptors
)
const isCurrentUserManager = computed(
  () => store.getters.isCurrentUserProductionManager
)
const isTVShow = computed(() => store.getters.isTVShow)
const taskMap = computed(() => store.getters.taskMap)
const taskTypeMap = computed(() => store.getters.taskTypeMap)

const entityList = computed(() => Array.from(editStore.cache.editMap.values()))

const title = computed(() => {
  if (!currentEdit.value) return t('main.loading')
  const { episode_name, name } = currentEdit.value
  return episode_name ? `${episode_name} / ${name}` : name
})

const editsPath = computed(() =>
  getEntitiesPath(currentProduction.value.id, 'edits', currentEpisode.value?.id)
)

const editTabs = computed(() => [
  { label: t('main.label.info'), name: 'infos' },
  { label: t('main.label.schedule'), name: 'schedule' },
  { label: t('main.label.preview_files'), name: 'preview-files' },
  { label: t('main.activity'), name: 'activity' },
  { label: t('main.label.timelog'), name: 'time-logs' }
])

// the task shown in the player follows the displayed preview file
const currentTask = computed(() => {
  const taskId = currentPreviewFile.value?.task_id
  return taskId ? taskMap.value.get(taskId) : undefined
})

const currentRevisions = computed(
  () => previewFiles.value[currentTask.value?.task_type_id] || []
)

// Functions
// --------------------------------------------------------------------------
const getCurrentEdit = () =>
  editStore.cache.editMap.get(route.params.edit_id) || null

// the preview flagged as current on the edit when it still belongs to one
// of the task type buckets, otherwise the first one available
const findCurrentPreviewFile = () => {
  const editPreviewId = currentEdit.value?.preview_file_id
  const buckets = Object.values(previewFiles.value)
  const current = buckets
    .flat()
    .find(previewFile => previewFile.id === editPreviewId)
  return current || buckets.find(bucket => bucket.length > 0)?.[0] || null
}

const loadPreviewFiles = async () => {
  const loadedPreviewFiles = await store.dispatch(
    'loadTaskEntityPreviewFiles',
    currentEdit.value.id
  )
  previewFiles.value = loadedPreviewFiles
  // PreviewsPerTaskType reads the preview files from the entity itself
  currentEdit.value.preview_files = loadedPreviewFiles
}

const resetData = async () => {
  await nextTick()
  await store.dispatch('loadEdits')
  currentEdit.value = getCurrentEdit()
  if (!currentEdit.value) return
  await loadPreviewFiles()
  currentPreviewFile.value = findCurrentPreviewFile()
  isLoading.value = false
}

const init = () => resetData().catch(console.error)

const scrollScheduleToStart = () => {
  scheduleWidget.value?.scrollToDate(scheduleItems.value[0].startDate)
}

const confirmEditEdit = async form => {
  isLoading.value = true
  errors.edit = false
  try {
    await store.dispatch('editEdit', { ...form, id: currentEdit.value.id })
    modals.edit = false
  } catch (err) {
    console.error(err)
    errors.edit = true
  }
  isLoading.value = false
}

// PreviewsPerTaskType picks a task type or revision, the player picks a
// revision: both land on the same selection
const onPreviewChanged = (entity, previewFile) => {
  currentPreviewFile.value = previewFile || null
  if (previewFile && currentEdit.value) {
    currentEdit.value.preview_file_id = previewFile.id
  }
}

const onChangeCurrentPreview = previewFile => {
  if (previewFile) onPreviewChanged(currentEdit.value, previewFile)
}

const onAnnotationChanged = async ({
  preview,
  additions,
  deletions,
  updates
}) => {
  try {
    await store.dispatch('updatePreviewAnnotation', {
      taskId: preview.task_id,
      preview,
      additions,
      deletions,
      updates
    })
    playerRef.value?.confirmAnnotationsSaved()
  } catch {
    playerRef.value?.restoreFailedAnnotations()
  }
}

// a preview added to one of the edit tasks, or removed with its comment,
// refreshes the buckets
const onPreviewFileAddFile = eventData => {
  if (eventData.project_id !== currentProduction.value.id) return
  const isEditTask = Object.values(previewFiles.value)
    .flat()
    .some(previewFile => previewFile.task_id === eventData.task_id)
  if (isEditTask) loadPreviewFiles().catch(console.error)
}

const onCommentDelete = eventData => {
  if (eventData.project_id !== currentProduction.value.id) return
  loadPreviewFiles().catch(console.error)
}

// the row picked in the task list, distinct from `currentTask`, which
// follows the preview file shown in the player
const {
  currentSection,
  currentTask: selectedTask,
  zoomLevel,
  zoomOptions,
  scheduleItems,
  previousEntityPath,
  nextEntityPath,
  currentTasks,
  tasksStartDate,
  tasksEndDate,
  onTaskSelected,
  saveTaskScheduleItem
} = useEntity({ type: 'edit', currentEntity: currentEdit, entityList, init })

// Watchers
// --------------------------------------------------------------------------
// needed when reloading the page with F5
watch(currentProduction, () => {
  if (!isTVShow.value) init()
})

watch(currentEpisode, () => {
  if (isTVShow.value && editStore.cache.editMap.size === 0) init()
})

watch(currentSection, () => {
  if (currentSection.value === 'schedule' && scheduleItems.value.length > 0) {
    scrollScheduleToStart()
  }
})

watch(zoomLevel, scrollScheduleToStart)

// Lifecycle
// --------------------------------------------------------------------------
onMounted(() => {
  socket.on('preview-file:add-file', onPreviewFileAddFile)
  socket.on('comment:delete', onCommentDelete)
  init()
})

onBeforeUnmount(() => {
  socket.off('preview-file:add-file', onPreviewFileAddFile)
  socket.off('comment:delete', onCommentDelete)
})

// Head
// --------------------------------------------------------------------------
useHead({ title: computed(() => `${title.value} - Kitsu`) })
</script>

<style lang="scss" scoped>
.dark .wrapper {
  background: var(--background);
}

.block {
  margin: 0;
}

.entity-title {
  font-weight: bold;
  margin-right: 1em;
}

.entity-thumbnail {
  margin-bottom: 0;
}

.main-block {
  padding: 0.5em 1.5em;
}

.edit-data {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 1em;
  overflow: hidden;
  min-height: 300px;
}

.edit-metadata {
  min-height: 100px;
  width: 100%;
}

.page-header {
  margin-top: calc(50px + 2em);
  margin-left: 1em;
  margin-right: 1em;
}

.infos {
  height: 100%;
  margin-top: 1em;
  margin-bottom: 1em;
  max-height: 100%;
  overflow-y: auto;
}

.field-label {
  font-weight: bold;
  width: 140px;
}

.back-link {
  padding-top: 3px;
}

.datatable-row {
  user-select: text;
}

.task-list {
  flex: 1;
  margin-bottom: 3em;
  min-height: 150px;
  min-width: 100%;
}

.schedule {
  position: relative;
  height: 300px;
  padding: 10px;

  .wrapper {
    height: 230px;
    border-radius: 10px;
  }
}

.column.main-column {
  background: var(--background-page);
  padding-bottom: 1em;
}

.player {
  margin: 1em;
}

@media screen and (max-width: 768px) {
  .edit {
    overflow: visible;
  }

  .main-column {
    flex: 1;
    margin: 0;
    max-width: 100%;
    min-height: 0;
    overflow-y: auto;
    width: 100%;
  }

  .column:first-child {
    margin-right: 0;
  }

  .page-header {
    margin: calc(60px + 1em) 0.5em 0.5em;
  }

  .main-block {
    flex-wrap: wrap;
    padding: 0.5em;
  }

  .entity-title {
    font-size: 1.3em;
    line-height: 1.5em;
  }

  .player {
    margin: 0.5em;
  }

  .edit-data {
    margin: 0 0.5em;
    max-height: none;
    overflow: visible;
  }

  .infos {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .infos .button {
    display: none;
  }

  .task-list {
    min-height: 0;
    overflow: visible;
  }

  .schedule {
    overflow-x: auto;

    .wrapper {
      min-width: 520px;
    }
  }
}
</style>
