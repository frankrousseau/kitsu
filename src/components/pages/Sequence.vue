<template>
  <div class="columns fixed-page sequence xyz-in" xyz="fade">
    <div class="page column main-column">
      <div class="page-header flexrow">
        <router-link
          class="flexrow-item has-text-centered back-link ml1"
          :to="sequencesPath"
        >
          <corner-left-up-icon />
        </router-link>
        <span class="flexrow-item ml2">
          <entity-thumbnail
            class="entity-thumbnail"
            :entity="currentSequence"
            :empty-width="100"
            :empty-height="60"
            :width="100"
            v-if="currentSequence"
          />
        </span>
        <div class="entity-title flexrow-item">
          {{ title }}
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

      <div class="sequence-data block">
        <route-section-tabs
          class="section-tabs"
          :active-tab="currentSection"
          :route="$route"
          :tabs="sequenceTabs"
        />

        <div class="flexrow mt1">
          <template v-if="currentSection === 'casting'">
            <span v-if="nbAssets > 0">
              {{ nbAssets }} {{ $t('assets.number', { count: nbAssets }) }}
            </span>
            <button-simple
              class="flexrow-item ml1"
              icon="film"
              :title="$t('playlists.view_as_playlist')"
              @click="viewPlaylist(castAssets)"
              v-if="castAssets.length > 0"
            />
            <span
              class="tag tag-standby"
              v-if="currentSequence?.is_casting_standby"
            >
              {{ $t('breakdown.fields.standby') }}
            </span>
          </template>
          <div class="filler"></div>
          <template
            v-if="
              currentSection === 'schedule' &&
              scheduleItems[0].children.length > 0
            "
          >
            <span class="flexrow-item mt05">
              {{ $t('schedule.zoom_level') }}:
            </span>
            <combobox-number
              class="zoom-level flexrow-item"
              is-simple
              :options="zoomOptions"
              v-model="zoomLevel"
            />
          </template>
        </div>

        <div class="flexcolumn infos" v-show="currentSection === 'infos'">
          <page-subtitle :text="$t('main.tasks')" />
          <entity-task-list
            class="task-list"
            :entries="currentTasks"
            :is-loading="!currentSequence"
            :is-error="false"
            :selected-task-id="currentTask?.id"
            @task-selected="onTaskSelected"
          />
          <div class="flexrow">
            <page-subtitle :text="$t('main.info')" />
            <div class="filler"></div>
            <div class="flexrow-item has-text-right">
              <button-simple
                icon="edit"
                :title="$t('sequences.edit_title')"
                @click="modals.edit = true"
                v-if="isCurrentUserManager"
              />
            </div>
          </div>

          <div class="table-body metadata-infos">
            <table class="datatable no-header" v-if="currentSequence">
              <tbody class="datatable-body">
                <tr class="datatable-row">
                  <td class="field-label">
                    {{ $t('shots.fields.description') }}
                  </td>
                  <description-cell :entry="currentSequence" :full="true" />
                </tr>
                <tr
                  :key="descriptor.id"
                  class="datatable-row"
                  v-for="descriptor in sequenceMetadataDescriptors"
                >
                  <td class="field-label">{{ descriptor.name }}</td>
                  <td>
                    <metadata-value
                      :descriptor="descriptor"
                      :entity="currentSequence"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <entity-chat
          :entity="currentSequence"
          :name="currentSequence?.full_name"
          v-if="currentSection === 'chat'"
        />

        <div class="sequence-casting" v-show="currentSection === 'casting'">
          <template v-if="currentSequence">
            <div v-if="currentSequence.castingAssetsByType?.[0]?.length > 0">
              <div
                class="type-assets"
                :key="
                  typeAssets.length > 0 ? typeAssets[0].asset_type_name : ''
                "
                v-for="typeAssets in currentSequence.castingAssetsByType"
              >
                <div class="asset-type flexrow">
                  <span class="flexrow-item">
                    {{
                      typeAssets.length > 0 ? typeAssets[0].asset_type_name : ''
                    }}
                    ({{ typeAssets.length }})
                  </span>
                  <button-simple
                    class="flexrow-item"
                    icon="film"
                    :title="$t('playlists.view_as_playlist')"
                    @click="viewPlaylist(typeAssets)"
                  />
                </div>
                <div class="asset-list">
                  <router-link
                    class="asset-link"
                    :key="asset.id"
                    :to="assetPath(asset)"
                    v-for="asset in typeAssets"
                  >
                    <entity-thumbnail
                      class="entity-thumbnail"
                      :class="{ shared: asset.shared }"
                      :entity="asset"
                      :square="true"
                      :empty-width="103"
                      :empty-height="103"
                      :with-link="false"
                    />
                    <div class="break-word">
                      {{ asset.asset_name }}
                      <span v-if="asset.nb_occurences > 1">
                        ({{ asset.nb_occurences }})
                      </span>
                    </div>
                    <div class="ready-for flexrow" v-if="asset.ready_for">
                      <task-type-name
                        class="flexrow-item"
                        :task-type="taskTypeMap.get(asset.ready_for)"
                        :current-production-id="currentProduction.id"
                        :title="
                          'Ready for: ' +
                          (taskTypeMap.get(asset.ready_for)?.name || '')
                        "
                      />
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
            <empty-section
              :icon="BoxIcon"
              :text="$t('sequences.no_casting')"
              v-else
            />
          </template>
          <table-info
            :is-loading="casting.isLoading"
            :is-error="casting.isError"
            v-else
          />
        </div>

        <div
          class="schedule mt1"
          v-if="scheduleItems[0].children.length > 0"
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
          :entity="currentSequence"
          v-if="currentSequence && currentSection === 'preview-files'"
        />

        <entity-time-logs
          :entity="currentSequence"
          v-if="currentSequence && currentSection === 'time-logs'"
        />
      </div>
    </div>

    <div
      class="drawer-backdrop"
      :class="{ 'is-open': isTaskDrawerOpen }"
      @click="closeTask"
      v-show="currentSection === 'infos'"
    ></div>
    <div
      class="column side-column"
      :class="{ 'is-open': isTaskDrawerOpen }"
      v-show="currentSection === 'infos'"
    >
      <task-info :task="currentTask" entity-type="Sequence" with-actions>
        <entity-news class="news-column" :entity="currentSequence" />
      </task-info>
    </div>

    <view-playlist-modal
      active
      entity-type="asset"
      :entity-ids="playlistEntityIds"
      @cancel="playlistEntityIds = null"
      v-if="playlistEntityIds"
    />

    <edit-sequence-modal
      :active="modals.edit"
      :is-loading="loading.edit"
      :is-error="errors.edit"
      :sequence-to-edit="currentSequence"
      @cancel="modals.edit = false"
      @confirm="confirmEditSequence"
    />
  </div>
</template>

<script setup>
// Imports
// --------------------------------------------------------------------------
import { useHead } from '@unhead/vue'
import {
  BoxIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerLeftUpIcon
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { useEntity } from '@/composables/entity'
import { episodifyRoute, getEntitiesPath } from '@/lib/path'
import sequenceStore from '@/store/modules/sequences'

import DescriptionCell from '@/components/cells/DescriptionCell.vue'
import EntityTaskList from '@/components/lists/EntityTaskList.vue'
import EditSequenceModal from '@/components/modals/EditSequenceModal.vue'
import ViewPlaylistModal from '@/components/modals/ViewPlaylistModal.vue'
import EntityChat from '@/components/pages/entities/EntityChat.vue'
import EntityNews from '@/components/pages/entities/EntityNews.vue'
import EntityPreviewFiles from '@/components/pages/entities/EntityPreviewFiles.vue'
import EntityTimeLogs from '@/components/pages/entities/EntityTimeLogs.vue'
import TaskInfo from '@/components/sides/TaskInfo.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import ComboboxNumber from '@/components/widgets/ComboboxNumber.vue'
import EmptySection from '@/components/widgets/EmptySection.vue'
import EntityThumbnail from '@/components/widgets/EntityThumbnail.vue'
import MetadataValue from '@/components/widgets/MetadataValue.vue'
import PageSubtitle from '@/components/widgets/PageSubtitle.vue'
import RouteSectionTabs from '@/components/widgets/RouteSectionTabs.vue'
import Schedule from '@/components/widgets/Schedule.vue'
import TableInfo from '@/components/widgets/TableInfo.vue'
import TaskTypeName from '@/components/widgets/TaskTypeName.vue'

defineOptions({ name: 'sequence' })

// Composables
// --------------------------------------------------------------------------
const { t } = useI18n()
const route = useRoute()
const store = useStore()

// State
// --------------------------------------------------------------------------
const currentSequence = ref(null)
const playlistEntityIds = ref(null)
const scheduleWidget = ref(null)
const casting = reactive({ isLoading: false, isError: false })
const errors = reactive({ edit: false })
const loading = reactive({ edit: false })
const modals = reactive({ edit: false })

// Computed
// --------------------------------------------------------------------------
const currentEpisode = computed(() => store.getters.currentEpisode)
const currentProduction = computed(() => store.getters.currentProduction)
const isCurrentUserManager = computed(
  () => store.getters.isCurrentUserProductionManager
)
const isTVShow = computed(() => store.getters.isTVShow)
const sequenceMetadataDescriptors = computed(
  () => store.getters.sequenceMetadataDescriptors
)
const sequenceSearchText = computed(() => store.getters.sequenceSearchText)
const taskTypeMap = computed(() => store.getters.taskTypeMap)

const entityList = computed(() => sequenceStore.cache.sequences)

const title = computed(() => {
  if (!currentSequence.value) return t('main.loading')
  const { name } = currentSequence.value
  return currentEpisode.value ? `${currentEpisode.value.name} / ${name}` : name
})

const castAssets = computed(() =>
  (currentSequence.value?.castingAssetsByType || []).flat()
)
const nbAssets = computed(() => castAssets.value.length)

const sequencesPath = computed(() => ({
  ...getEntitiesPath(
    currentProduction.value.id,
    'sequences',
    currentEpisode.value?.id
  ),
  query: { search: sequenceSearchText.value }
}))

const sequenceTabs = computed(() => [
  { label: t('main.label.info'), name: 'infos' },
  { label: t('main.label.chat'), name: 'chat' },
  { label: t('main.label.casting'), name: 'casting' },
  { label: t('main.label.schedule'), name: 'schedule' },
  { label: t('main.label.preview_files'), name: 'preview-files' },
  { label: t('main.label.timelog'), name: 'time-logs' }
])

const isTaskDrawerOpen = computed(() => Boolean(currentTask.value))

// Functions
// --------------------------------------------------------------------------
// the sequence list only carries the tasks once loaded with them, and on
// a TV show that load is scoped to the current episode, which the route
// without episode leaves unset: align it on the sequence's own episode
const getCurrentSequence = async () => {
  const sequenceId = route.params.sequence_id
  let sequence = sequenceStore.cache.sequenceMap.get(sequenceId) || null
  if (!sequence?.validations) {
    if (isTVShow.value) {
      await store.dispatch('loadEpisodes')
      const { parent_id } =
        sequence || (await store.dispatch('loadSequence', sequenceId)) || {}
      const episodeId = currentEpisode.value?.id
      if (parent_id && episodeId !== 'all' && episodeId !== parent_id) {
        store.dispatch('setCurrentEpisode', parent_id)
      }
    }
    await store.dispatch('loadSequencesWithTasks')
    sequence = sequenceStore.cache.sequenceMap.get(sequenceId) || null
  }
  return sequence
}

const loadCastingData = async () => {
  casting.isLoading = true
  casting.isError = false
  try {
    await store.dispatch('loadSequenceCasting', currentSequence.value)
  } catch (err) {
    casting.isError = true
    console.error(err)
  }
  casting.isLoading = false
}

const scrollScheduleToStart = () => {
  scheduleWidget.value?.scrollToDate(scheduleItems.value[0].startDate)
}

const resetData = async () => {
  casting.isLoading = true
  await nextTick()
  currentSequence.value = await getCurrentSequence()
  await loadCastingData()
}

const init = async () => {
  try {
    currentSequence.value = await getCurrentSequence()
    currentSection.value = route.query.section || 'infos'
    if (currentSequence.value) {
      loadCastingData()
    } else {
      resetData()
    }
    setTimeout(scrollScheduleToStart, 100)
  } catch (err) {
    console.error(err)
  }
}

const assetPath = asset =>
  episodifyRoute(
    {
      name: 'asset',
      params: {
        production_id: currentProduction.value.id,
        asset_id: asset.asset_id
      }
    },
    isTVShow.value ? currentEpisode.value?.id || 'main' : null
  )

const confirmEditSequence = async form => {
  loading.edit = true
  errors.edit = false
  try {
    await store.dispatch('editSequence', {
      ...form,
      id: currentSequence.value.id
    })
    modals.edit = false
  } catch (err) {
    console.error(err)
    errors.edit = true
  }
  loading.edit = false
}

const closeTask = () => {
  if (currentTask.value) onTaskSelected(currentTask.value)
}

const viewPlaylist = assets => {
  playlistEntityIds.value = assets.map(asset => asset.asset_id)
}

const {
  currentSection,
  currentTask,
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
} = useEntity({
  type: 'sequence',
  currentEntity: currentSequence,
  entityList,
  init
})

// Watchers
// --------------------------------------------------------------------------
watch(currentSection, () => {
  if (currentSection.value === 'schedule' && scheduleItems.value.length > 0) {
    scrollScheduleToStart()
  }
})

watch(zoomLevel, scrollScheduleToStart)

// Lifecycle
// --------------------------------------------------------------------------
onMounted(() => {
  store.dispatch('clearSelectedTasks')
  init()
})

// Head
// --------------------------------------------------------------------------
useHead({ title: computed(() => `${title.value} - Kitsu`) })
</script>

<style lang="scss" scoped>
.dark {
  .table-body {
    border: 1px solid var(--border);
  }

  .wrapper {
    background: var(--background);
  }
}

.main-column {
  display: flex;
  flex-direction: column;
  background: var(--background-page);
  padding-bottom: 1em;
}

h2.subtitle {
  border-bottom: 0;
  margin-top: 0;
  margin-bottom: 0.5em;
  font-size: 1.5em;
}

.page-header {
  align-items: center;
  margin-top: calc(50px + 2em);
  margin-bottom: 0.8em;
  margin-left: 1em;
  margin-right: 1em;

  .entity-title {
    font-weight: 500;
  }
}

.sequence-data {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 1em 0 1em;
  max-height: 100%;
  overflow: hidden;
}

.sequence-casting {
  overflow-y: auto;
}

.asset-type {
  text-transform: uppercase;
  font-size: 1.2em;
  color: var(--text);
  margin-top: 2em;
  margin-bottom: 0.4em;
}

.asset-list {
  color: var(--text);
  display: flex;
  flex-wrap: wrap;
}

.asset-link {
  color: inherit;
  margin-left: 0.5em;
  margin-right: 0.5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8em;

  .entity-thumbnail.shared {
    box-shadow: 0 0 3px 2px var(--shared-color);
  }

  .ready-for .no-link {
    cursor: inherit;
  }
}

.asset-link {
  margin-bottom: 1em;
}

.asset-link div {
  max-width: 100px;
}

.asset-link span {
  word-wrap: break-word;
}

.field-label {
  font-weight: bold;
  width: 140px;
}

.back-link {
  padding-top: 3px;
}

.task-list {
  flex: 1;
  margin-bottom: 3em;
  min-height: 150px;
  min-width: 100%;
  overflow: hidden;
}

.datatable-row {
  user-select: text;
}

.schedule {
  position: relative;
  height: 100%;
  overflow: hidden;

  .wrapper {
    height: 100%;
    border-radius: 10px;
  }
}

.entity-thumbnail {
  margin-bottom: 0.5em;
  border-radius: 10px;
}

@media screen and (max-width: 768px) {
  .sequence {
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

  .entity-title {
    font-size: 1.3em;
    line-height: 1.5em;
  }

  .sequence-data {
    margin: 0 0.5em;
    max-height: none;
    overflow: visible;
  }

  .infos,
  .sequence-casting,
  .schedule {
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
    height: 60vh;
    overflow-x: auto;

    .wrapper {
      min-width: 520px;
    }
  }

  .news-column {
    max-height: none;
  }
}

.tag-standby {
  background: $red;
  color: $white;
  margin-left: 1em;
  cursor: default;
  text-transform: uppercase;
}

.dark .tag-standby {
  background: $dark-red;
}

.section-tabs {
  min-height: 36px;
  margin-bottom: 0;
}

.infos {
  height: 100%;
  margin-top: 1em;
  margin-bottom: 1em;
  max-height: 100%;
  overflow-y: auto;

  .metadata-infos {
    flex: unset;
    min-height: 100px;
    overflow: auto;
  }
}

.news-column {
  max-height: 85%;
}

.drawer-backdrop {
  display: none;
}

@media (max-width: 1024px) {
  .sequence {
    animation-fill-mode: none;
  }

  .side-column {
    background: var(--background);
    bottom: 0;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    margin-top: 0 !important;
    max-width: min(100vw, 420px) !important;
    min-width: 0 !important;
    overflow-y: auto;
    position: fixed;
    right: 0;
    top: 60px;
    transform: translateX(100%);
    transition: transform 0.25s ease;
    width: min(100vw, 420px) !important;
    z-index: 250;

    &.is-open {
      transform: translateX(0);
    }
  }

  .drawer-backdrop {
    background: rgba(0, 0, 0, 0.4);
    display: block;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    transition: opacity 0.25s ease;
    z-index: 249;

    &.is-open {
      opacity: 1;
      pointer-events: auto;
    }
  }
}
</style>
