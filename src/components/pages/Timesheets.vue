<template>
  <div class="columns fixed-page">
    <div class="column main-column">
      <div class="timesheets page">
        <div class="page-header flexrow">
          <combobox-production
            class="flexrow-item"
            :label="$t('main.production')"
            :production-list="productionList"
            v-model="productionId"
          />
          <combobox-studio
            class="flexrow-item field"
            all-studios-label
            :label="$t('main.studio')"
            v-model="studioId"
          />
          <combobox
            class="flexrow-item nowrap"
            :label="$t('timesheets.detail_level')"
            :options="detailOptions"
            v-model="detailLevel"
          />
          <combobox
            class="flexrow-item"
            :label="$t('timesheets.year')"
            :options="yearOptions"
            v-model="currentYear"
            v-if="detailLevel !== 'year'"
          />
          <combobox
            class="flexrow-item"
            :label="$t('timesheets.month')"
            :options="monthOptions"
            v-model="currentMonth"
            v-if="detailLevel === 'day'"
          />
          <combobox
            class="flexrow-item"
            :label="$t('timesheets.unit')"
            :options="unitOptions"
            v-model="unit"
          />
          <div class="filler"></div>
          <button-simple
            class="flexrow-item"
            :title="$t('timesheets.export_timesheet')"
            icon="export"
            @click="exportTimesheet"
          />
          <button-href-link
            class="flexrow-item"
            :title="$t('timesheets.export_timespents')"
            path="/api/export/csv/time-spents.csv"
            icon="export-lines"
            v-if="isCurrentUserAdmin"
          />
        </div>

        <people-timesheet-list
          class="data-list"
          :people="filteredPeople"
          :timesheet="timesheet"
          :detail-level="detailLevel"
          :month="currentMonth"
          :year="currentYear"
          :unit="unit"
          :is-loading="isLoading"
          :is-error="isLoadingError"
        />
      </div>
    </div>
    <div class="column side-column" v-if="showInfo">
      <people-timesheet-info
        :person="currentPerson"
        :production="productionId"
        :year="currentYear"
        :month="currentMonth"
        :week="currentWeek"
        :day="currentDay"
        :unit="unit"
        :is-loading="isInfoLoading"
        :is-loading-error="isInfoLoadingError"
        :tasks="tasks"
        :day-off-count="dayOffCount"
      />
    </div>
  </div>
</template>

<script setup>
// Imports
// --------------------------------------------------------------------------
import { useHead } from '@unhead/vue'
import moment from 'moment-timezone'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import csv from '@/lib/csv'
import { sortByName } from '@/lib/sorting'
import stringHelpers from '@/lib/string'
import { monthToString, range } from '@/lib/time'

import PeopleTimesheetList from '@/components/lists/PeopleTimesheetList.vue'
import PeopleTimesheetInfo from '@/components/sides/PeopleTimesheetInfo.vue'
import ButtonHrefLink from '@/components/widgets/ButtonHrefLink.vue'
import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import Combobox from '@/components/widgets/Combobox.vue'
import ComboboxProduction from '@/components/widgets/ComboboxProduction.vue'
import ComboboxStudio from '@/components/widgets/ComboboxStudio.vue'

// Composables
// --------------------------------------------------------------------------
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useStore()

// State
// --------------------------------------------------------------------------
const dayOffCount = ref(0)
const isInfoLoading = ref(false)
const isInfoLoadingError = ref(false)
const isLoading = ref(false)
const isLoadingError = ref(false)
const tasks = ref([])
const unit = ref('hour')

// Computed
// --------------------------------------------------------------------------
const isCurrentUserAdmin = computed(() => store.getters.isCurrentUserAdmin)
const organisation = computed(() => store.getters.organisation)
const people = computed(() => store.getters.people)
const personMap = computed(() => store.getters.personMap)
const productions = computed(() => store.getters.productions)
const timesheet = computed(() => store.getters.timesheet)

// The route holds the whole selection: every filter reads it back and writes
// to it, so there is no local copy to keep in sync.
const detailLevel = computed({
  get: () => route.name?.split('-')[1] ?? 'day',
  set: level => {
    const params = { year: currentYear.value }
    if (level === 'day') params.month = currentMonth.value
    pushLevelRoute(level, params)
  }
})

const currentYear = computed({
  get: () => Number(route.params.year) || moment().year(),
  set: year => {
    if (['month', 'week'].includes(detailLevel.value)) {
      pushLevelRoute(detailLevel.value, { year })
    } else {
      pushLevelRoute('day', {
        year,
        month: Math.min(currentMonth.value, moment().month() + 1)
      })
    }
  }
})

const currentMonth = computed({
  get: () => Number(route.params.month) || moment().month() + 1,
  set: month => pushLevelRoute('day', { year: currentYear.value, month })
})

const currentWeek = computed(
  () => Number(route.params.week) || moment().isoWeek()
)

const currentDay = computed(() => Number(route.params.day) || moment().date())

const productionId = computed({
  get: () => route.query.productionId ?? '',
  set: value => pushQuery('productionId', value)
})

const studioId = computed({
  get: () => route.query.studioId ?? '',
  set: value => pushQuery('studioId', value)
})

const showInfo = computed(() => Boolean(route.params.person_id))

const currentPerson = computed(
  () => personMap.value.get(route.params.person_id) ?? {}
)

const detailOptions = computed(() => [
  { label: t('main.day'), value: 'day' },
  { label: t('main.week'), value: 'week' },
  { label: t('main.month'), value: 'month' },
  { label: t('main.year'), value: 'year' }
])

const unitOptions = computed(() => [
  { label: t('main.hour'), value: 'hour' },
  { label: t('main.day'), value: 'day' }
])

const productionList = computed(() => {
  const productionOptions = sortByName([...productions.value]).map(
    production => {
      const suffix =
        production.project_status_name === 'Closed' ? ' (closed)' : ''
      return { ...production, name: production.name + suffix }
    }
  )
  return [{ id: '', name: t('main.all') }, ...productionOptions]
})

const filteredPeople = computed(() =>
  people.value.filter(person =>
    Object.values(timesheet.value).some(
      entry => entry?.[person.id] !== undefined
    )
  )
)

const yearOptions = computed(() =>
  range(2018, moment().year()).map(year => ({
    label: `${year}`,
    value: year
  }))
)

const monthOptions = computed(() => {
  const lastMonth =
    currentYear.value === moment().year() ? moment().month() + 1 : 12
  return range(1, lastMonth).map(month => ({
    label: monthToString(month),
    value: month
  }))
})

// Functions
// --------------------------------------------------------------------------
const pushLevelRoute = (level, params) =>
  router.push({ name: `timesheets-${level}`, params, query: route.query })

const pushQuery = (key, value) => {
  if ((route.query[key] ?? '') === value) return
  router.push({ query: { ...route.query, [key]: value || undefined } })
}

const reloadTimesheet = async () => {
  isLoading.value = true
  isLoadingError.value = false
  try {
    await store.dispatch('loadTimesheets', {
      detailLevel: detailLevel.value,
      year: currentYear.value,
      month: currentMonth.value,
      productionId: productionId.value,
      studioId: studioId.value
    })
  } catch (error) {
    console.error(error)
    isLoadingError.value = true
  }
  isLoading.value = false
}

const loadAggregate = async () => {
  isInfoLoading.value = true
  isInfoLoadingError.value = false
  tasks.value = []
  try {
    const aggregatedTasks = await store.dispatch(
      'loadAggregatedPersonTimeSpents',
      {
        personId: route.params.person_id,
        detailLevel: detailLevel.value,
        year: route.params.year,
        month: route.params.month,
        week: route.params.week,
        day: route.params.day,
        productionId: productionId.value,
        studioId: studioId.value
      }
    )
    tasks.value = aggregatedTasks.filter(task => task.duration > 0)
    const dayOffs = await store.dispatch('loadAggregatedPersonDaysOff', {
      personId: route.params.person_id,
      detailLevel: detailLevel.value,
      year: route.params.year,
      month: route.params.month,
      week: route.params.week
    })
    dayOffCount.value = dayOffs.length
  } catch (error) {
    console.error(error)
    isInfoLoadingError.value = true
  }
  isInfoLoading.value = false
}

const exportTimesheet = () => {
  const nameData = ['timesheet', detailLevel.value, currentYear.value]
  if (detailLevel.value === 'day') nameData.push(currentMonth.value)
  const name = stringHelpers.slugify(nameData.join('_'))
  csv.generateTimesheet({
    name,
    timesheet: timesheet.value,
    people: filteredPeople.value,
    unit: unit.value,
    organisation: organisation.value,
    detailLevel: detailLevel.value,
    todayYear: currentYear.value,
    todayMonth: currentMonth.value,
    year: moment().year(),
    month: moment().month() + 1,
    week: moment().isoWeek()
  })
}

// Watchers
// --------------------------------------------------------------------------
watch(
  [detailLevel, currentYear, currentMonth, productionId, studioId],
  reloadTimesheet
)

watch(
  () => route.fullPath,
  () => {
    if (showInfo.value) loadAggregate()
  }
)

// Lifecycle
// --------------------------------------------------------------------------
onMounted(async () => {
  isLoading.value = true
  store.dispatch('loadProductions')
  if (!people.value.length) {
    await store.dispatch('loadPeople')
  }
  reloadTimesheet()
  if (showInfo.value) loadAggregate()
})

// Head
// --------------------------------------------------------------------------
useHead({ title: computed(() => `${t('timesheets.title')} - Kitsu`) })
</script>

<style lang="scss" scoped>
.dark .side-column {
  border-color: $dark-grey-lightest;
}

.data-list {
  margin-top: 0;
}

.timesheets {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 1em;
}

.side-column {
  border-left: 3px solid $light-grey;
}

.title {
  margin-right: 1em;
  white-space: nowrap;
}

// measured on the live row: ComboboxStudio deviates on BOTH metrics of
// the centered header row, so both need pinning. Its label takes a 5px
// padding-top under the field class, and its control renders 38px tall
// against 42px for the production combo and the Bulma selects.
.page-header :deep(.label) {
  margin-bottom: 5px;
  padding-top: 0;
}

.page-header :deep(.studio-combo) {
  display: flex;
  flex-direction: column;
  height: 42px;
  justify-content: center;
}
</style>
