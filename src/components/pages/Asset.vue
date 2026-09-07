<template>
  <div class="columns fixed-page asset xyz-in" xyz="fade">
    <div class="page column main-column">
      <div class="page-header flexrow">
        <router-link
          class="flexrow-item has-text-centered back-link ml1"
          :to="assetsPath"
        >
          <corner-left-up-icon />
        </router-link>
        <span class="flexrow-item ml2">
          <entity-thumbnail
            class="entity-thumbnail"
            :entity="currentAsset"
            :empty-width="100"
            :empty-height="60"
            :width="100"
            v-if="currentAsset"
          />
        </span>
        <div class="entity-title flexrow-item">
          {{ title }}
        </div>
        <div class="filler"></div>
        <div
          class="ready-for flexrow block mr0 flexrow-item mt1 mb0"
          v-if="
            currentAsset &&
            currentAsset.ready_for &&
            currentAsset.ready_for !== 'None'
          "
        >
          <span class="flexrow-item">
            {{ $t('assets.fields.ready_for') }}
          </span>
          <task-type-name
            class="flexrow-item"
            :task-type="taskTypeMap.get(currentAsset.ready_for)"
            :current-production-id="currentProduction.id"
          />
        </div>
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

      <div class="asset-data block">
        <route-section-tabs
          class="section-tabs"
          :active-tab="currentSection"
          :route="$route"
          :tabs="assetTabs"
        />

        <div class="flexrow mt1">
          <span
            class="tag tag-standby"
            v-if="
              currentSection === 'casting' && currentAsset?.is_casting_standby
            "
          >
            {{ $t('breakdown.fields.standby') }}
          </span>
          <template v-if="currentSection === 'schedule'">
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
            :entries="localTasks"
            :is-loading="!currentAsset"
            :is-error="false"
            @task-selected="onTaskSelected"
          />
          <div class="flexrow">
            <page-subtitle :text="$t('main.info')" />
            <div class="filler"></div>
            <div class="flexrow-item has-text-right">
              <button-simple
                icon="edit"
                :title="$t('assets.edit_title')"
                @click="modals.edit = true"
                v-if="isCurrentUserManager"
              />
            </div>
          </div>

          <div class="table-body metadata-infos">
            <table class="datatable no-header" v-if="currentAsset">
              <tbody class="table-body">
                <tr class="datatable-row">
                  <td class="field-label">
                    {{ $t('assets.fields.description') }}
                  </td>
                  <description-cell :entry="currentAsset" :full="true" />
                </tr>
                <tr
                  :key="descriptor.id"
                  class="datatable-row"
                  v-for="descriptor in assetMetadataDescriptors"
                >
                  <td class="field-label">{{ descriptor.name }}</td>
                  <td>
                    <metadata-value
                      :descriptor="descriptor"
                      :entity="currentAsset"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <entity-chat
          :entity="currentAsset"
          :name="currentAsset?.full_name"
          v-if="currentSection === 'chat'"
        />

        <div class="asset-casted-in" v-show="currentSection === 'casting'">
          <template v-if="currentAsset">
            <div v-if="currentAsset.castInShotsBySequence?.[0]?.length > 0">
              <em>{{
                $t('assets.casted_in_shots', { nbShots: nbShotsCastedIn })
              }}</em>
              <template
                v-if="
                  currentAsset.castInShotsBySequence?.[0]?.[0]?.sequence_name
                "
              >
                <div
                  class="sequence-shots"
                  :key="
                    sequenceShots?.length > 0
                      ? sequenceShots[0].sequence_name
                      : ''
                  "
                  v-for="sequenceShots in currentAsset.castInShotsBySequence ||
                  []"
                >
                  <div class="shot-sequence">
                    {{
                      sequenceShots?.length > 0
                        ? sequenceShots[0].sequence_name
                        : ''
                    }}
                  </div>
                  <div class="shot-list">
                    <router-link
                      class="shot-link"
                      :key="shot.shot_id"
                      :to="shotPath(shot)"
                      v-for="shot in sequenceShots"
                    >
                      <entity-thumbnail
                        class="entity-thumbnail"
                        :entity="shot"
                        :square="true"
                        :empty-width="103"
                        :empty-height="103"
                        :with-link="false"
                      />
                      <div>
                        <span class="break-word">{{ shot.shot_name }}</span>
                        <span v-if="shot.nb_occurences > 1">
                          ({{ shot.nb_occurences }})
                        </span>
                      </div>
                    </router-link>
                  </div>
                </div>
              </template>
            </div>
            <div
              class="mt1"
              v-else-if="currentAsset.castingAssetsByType?.[0]?.length === 0"
            >
              {{ $t('assets.no_cast_in') }}
            </div>
          </template>
          <table-info
            :is-loading="castIn.isLoading"
            :is-error="castIn.isError"
            v-else
          />

          <div
            v-if="
              currentAsset && currentAsset.castingAssetsByType?.[0]?.length > 0
            "
          >
            <page-subtitle :text="$t('assets.linked')" />
            <template v-if="currentAsset.castingAssetsByType?.[0]?.length > 0">
              <div
                class="type-assets"
                :key="
                  typeAssets.length > 0 ? typeAssets[0].asset_type_name : ''
                "
                v-for="typeAssets in currentAsset.castingAssetsByType"
              >
                <div class="asset-type">
                  {{
                    typeAssets.length > 0 ? typeAssets[0].asset_type_name : ''
                  }}
                  ({{ typeAssets.length }})
                </div>
                <div class="asset-list">
                  <router-link
                    class="asset-link"
                    :key="asset.id"
                    :to="{
                      name: 'asset',
                      params: {
                        production_id: currentProduction.id,
                        asset_id: asset.asset_id
                      }
                    }"
                    v-for="asset in typeAssets"
                  >
                    <entity-thumbnail
                      class="entity-thumbnail"
                      :entity="asset"
                      :square="true"
                      :empty-width="103"
                      :empty-height="103"
                      :with-link="false"
                    />
                    <div>
                      <span class="break-word">{{ asset.asset_name }}</span>
                      <span v-if="asset.nb_occurences > 1">
                        ({{ asset.nb_occurences }})
                      </span>
                    </div>
                  </router-link>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div
          class="concepts"
          v-show="currentSection === 'concepts'"
          v-if="currentAsset"
        >
          <combobox-status
            :label="$t('main.status')"
            :task-status-list="taskStatusList"
            v-model="currentConceptStatus"
          />
          <div class="concept-list mt1">
            <template v-if="filteredLinkedConcepts.length">
              <concept-card
                class="concept"
                :class="{ selected: currentConcept?.id === concept.id }"
                :key="'concept-' + concept.id"
                :concept="concept"
                @click="selectConcept(concept)"
                v-for="concept in filteredLinkedConcepts"
              />
            </template>
            <div v-else>
              {{ $t('assets.no_concept') }}
            </div>
          </div>
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

        <entity-preview-files
          :entity="currentAsset"
          v-if="currentSection === 'preview-files'"
        />

        <entity-time-logs
          :entity="currentAsset"
          v-if="currentSection === 'time-logs'"
        />

        <entity-output-files
          :entity="currentAsset"
          v-if="currentSection === 'output-files'"
        />
      </div>
    </div>

    <div class="column side-column" v-show="currentSection === 'infos'">
      <task-info :task="currentTask" entity-type="Asset" with-actions>
        <entity-news class="news-column" :entity="currentAsset" />
      </task-info>
    </div>

    <div class="column side-column" v-show="currentSection === 'concepts'">
      <task-info entity-type="Concept" :task="currentConceptTask" />
    </div>

    <edit-asset-modal
      :active="modals.edit"
      :is-loading="loading.edit"
      :is-error="errors.edit"
      :asset-to-edit="currentAsset"
      @cancel="modals.edit = false"
      @confirm="confirmEditAsset"
    />
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerLeftUpIcon
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { useEntity } from '@/composables/entity'
import { sortByName } from '@/lib/sorting'
import assetStore from '@/store/modules/assets'

/* eslint-disable no-unused-vars */
import DescriptionCell from '@/components/cells/DescriptionCell.vue'
import EntityTaskList from '@/components/lists/EntityTaskList.vue'
import EditAssetModal from '@/components/modals/EditAssetModal.vue'
import EntityChat from '@/components/pages/entities/EntityChat.vue'
import EntityNews from '@/components/pages/entities/EntityNews.vue'
import EntityOutputFiles from '@/components/pages/entities/EntityOutputFiles.vue'
import EntityPreviewFiles from '@/components/pages/entities/EntityPreviewFiles.vue'
import EntityTimeLogs from '@/components/pages/entities/EntityTimeLogs.vue'
import TaskInfo from '@/components/sides/TaskInfo.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import ComboboxNumber from '@/components/widgets/ComboboxNumber.vue'
import ComboboxStatus from '@/components/widgets/ComboboxStatus.vue'
import ConceptCard from '@/components/widgets/ConceptCard.vue'
import EntityThumbnail from '@/components/widgets/EntityThumbnail.vue'
import MetadataValue from '@/components/widgets/MetadataValue.vue'
import PageSubtitle from '@/components/widgets/PageSubtitle.vue'
import RouteSectionTabs from '@/components/widgets/RouteSectionTabs.vue'
import Schedule from '@/components/widgets/Schedule.vue'
import TableInfo from '@/components/widgets/TableInfo.vue'
import TaskTypeName from '@/components/widgets/TaskTypeName.vue'
/* eslint-enable no-unused-vars */

defineOptions({ name: 'asset' })

const { t } = useI18n()
const route = useRoute()
const store = useStore()

// State
// --------------------------------------------------------------------------
const currentAsset = ref(null)
const currentConcept = ref(null)
const currentConceptStatus = ref(null)
const currentConceptTask = ref(null)
const localTasks = ref([])
const scheduleWidget = ref(null)
const castIn = reactive({ isLoading: false, isError: false })
const errors = reactive({ edit: false })
const loading = reactive({ edit: false })
const modals = reactive({ edit: false })

// Computed
// --------------------------------------------------------------------------
const assetMetadataDescriptors = computed(
  () => store.getters.assetMetadataDescriptors
)
const assetSearchText = computed(() => store.getters.assetSearchText)
const currentEpisode = computed(() => store.getters.currentEpisode)
const currentProduction = computed(() => store.getters.currentProduction)
const isCurrentUserManager = computed(
  () => store.getters.isCurrentUserProductionManager
)
const linkedConcepts = computed(() => store.getters.linkedConcepts)
const taskMap = computed(() => store.getters.taskMap)
const taskStatusMap = computed(() => store.getters.taskStatusMap)
const taskTypeMap = computed(() => store.getters.taskTypeMap)

const entityList = computed(() => assetStore.cache.assets)

const title = computed(() =>
  currentAsset.value
    ? `${currentAsset.value.asset_type_name} / ${currentAsset.value.name}`
    : t('main.loading')
)

const nbShotsCastedIn = computed(() =>
  (currentAsset.value?.castInShotsBySequence || []).reduce(
    (acc, shots) => acc + shots.length,
    0
  )
)

const assetsPath = computed(() => {
  const path = {
    name: 'assets',
    params: { production_id: currentProduction.value.id },
    query: { search: assetSearchText.value || '' }
  }
  if (currentEpisode.value) {
    path.name = 'episode-assets'
    path.params.episode_id = currentEpisode.value.id
  }
  return path
})

const assetTabs = computed(() => [
  { label: t('main.label.info'), name: 'infos' },
  { label: t('main.label.chat'), name: 'chat' },
  { label: t('main.label.concepts'), name: 'concepts' },
  { label: t('main.label.casting'), name: 'casting' },
  { label: t('main.label.schedule'), name: 'schedule' },
  { label: t('main.label.preview_files'), name: 'preview-files' },
  { label: t('main.label.timelog'), name: 'time-logs' },
  { label: t('main.label.output_files'), name: 'output-files' }
])

const taskStatusList = computed(() => {
  const allStatusItem = {
    id: null,
    color: '#999',
    name: t('main.all'),
    short_name: t('main.all')
  }
  const conceptTaskStatusList = sortByName(
    Array.from(taskStatusMap.value.values()).filter(
      status => status.for_concept
    )
  )
  return [allStatusItem, ...conceptTaskStatusList]
})

const filteredLinkedConcepts = computed(() =>
  currentConceptStatus.value
    ? linkedConcepts.value.filter(
        concept =>
          concept.tasks[0].task_status_id === currentConceptStatus.value
      )
    : linkedConcepts.value
)

// Functions
// --------------------------------------------------------------------------
const getCurrentAsset = async () => {
  const assetId = route.params.asset_id
  if (!assetId) return null
  let asset = assetStore.cache.assetMap.get(assetId) || null
  if (!asset) {
    await store.dispatch('loadAsset', assetId)
    asset = assetStore.cache.assetMap.get(assetId)
    if (!asset) return null
  }
  localTasks.value = asset.tasks
    .map(taskId => taskMap.value.get(taskId))
    .filter(Boolean)
  return asset
}

const loadCastingData = async () => {
  castIn.isLoading = true
  castIn.isError = false
  try {
    await store.dispatch('loadAssetCastIn', currentAsset.value)
    await store.dispatch('loadAssetCasting', currentAsset.value)
    castIn.isLoading = false
    await store.dispatch('loadLinkedConcepts', currentAsset.value)
  } catch (err) {
    castIn.isLoading = false
    castIn.isError = true
    console.error(err)
  }
}

const scrollScheduleToStart = () => {
  scheduleWidget.value?.scrollToDate(scheduleItems.value[0].startDate)
}

const resetData = async () => {
  castIn.isLoading = true
  if (route.params.episode_id === 'main') {
    store.dispatch('setCurrentEpisode', 'main')
  }
  // Next tick is needed to wait for the episode change.
  await nextTick()
  currentAsset.value = await getCurrentAsset()
  await loadCastingData()
}

const init = async () => {
  try {
    currentAsset.value = await getCurrentAsset()
    currentSection.value = route.query.section || 'infos'
    if (currentAsset.value) {
      loadCastingData()
    } else {
      resetData()
    }
    setTimeout(scrollScheduleToStart, 100)
  } catch (err) {
    console.error(err)
  }
}

const shotPath = shot => ({
  name: shot.episode_id ? 'episode-shot' : 'shot',
  params: {
    production_id: currentProduction.value.id,
    shot_id: shot.shot_id,
    episode_id: shot.episode_id ? shot.episode_id : undefined
  }
})

const confirmEditAsset = async form => {
  const data = { ...form, id: currentAsset.value.id }
  loading.edit = true
  errors.edit = false
  const request = store.dispatch('editAsset', data)
  // editAsset commits optimistically, so the cache already holds the new values.
  currentAsset.value = { ...assetStore.cache.assetMap.get(data.id) }
  try {
    await request
    modals.edit = false
  } catch (err) {
    console.error(err)
    errors.edit = true
  }
  loading.edit = false
}

const selectConcept = concept => {
  store.dispatch('clearSelectedConcepts')
  if (currentConcept.value?.id === concept.id) {
    currentConcept.value = null
    currentConceptTask.value = null
  } else {
    store.dispatch('addSelectedConcepts', new Map([[concept.id, concept]]))
    currentConcept.value = concept
    currentConceptTask.value = concept.tasks[0]
  }
}

const {
  currentSection,
  currentTask,
  zoomLevel,
  zoomOptions,
  scheduleItems,
  previousEntityPath,
  nextEntityPath,
  tasksStartDate,
  tasksEndDate,
  onTaskSelected,
  saveTaskScheduleItem
} = useEntity({ type: 'asset', currentEntity: currentAsset, entityList, init })

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
  .page {
    padding-bottom: 1em;
  }

  .table-body {
    border: 1px solid $dark-grey;
  }

  .wrapper {
    background: $dark-grey-2;
  }
}

.ready-for {
  margin-top: 0em;
  margin-bottom: 0em;
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
  margin-top: calc(50px + 2em);
  margin-bottom: 0.8em;
  margin-left: 1em;
  margin-right: 1em;
  .entity-title {
    font-weight: 500;
  }
}

.asset-data {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 1em 0 1em;
  max-height: 100%;
  overflow: hidden;
}

.asset-casted-in,
.concepts {
  overflow-y: auto;
}

.sequence-shots {
  margin-bottom: 3em;
}

.asset-type,
.shot-sequence {
  text-transform: uppercase;
  font-size: 1.2em;
  color: var(--text);
  margin-top: 2em;
  margin-bottom: 0.4em;
}

.asset-list,
.shot-list,
.concept-list {
  color: var(--text);
  display: flex;
  flex-wrap: wrap;
}

.concept-list {
  padding-bottom: 1em;
  gap: 10px;
}

.asset-link,
.shot-link {
  color: inherit;
  margin-right: 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8em;
}

.asset-link div,
.shot-link div {
  max-width: 100px;
}

.asset-link span,
.shot-link span {
  word-wrap: break-word;
}

.field-label {
  font-weight: bold;
  width: 120px;
}

.page-header {
  align-items: center;
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
  margin-bottom: 0;
  border-radius: 10px;
}

@media screen and (max-width: 768px) {
  .column:first-child {
    margin-right: 0;
  }

  .entity-title {
    font-size: 1.3em;
    line-height: 1.5em;
  }
}

.tag-standby {
  background: $red;
  color: $white;
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

.concept {
  border: 5px solid transparent;
  cursor: pointer;
  transition: border 0.2s linear;
  &:hover {
    border: 5px solid var(--background-selectable);
  }
}

.selected {
  border: 5px solid var(--background-selected);
}
</style>
