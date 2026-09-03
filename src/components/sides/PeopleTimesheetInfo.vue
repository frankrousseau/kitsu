<template>
  <div class="people-timesheet-info">
    <div class="close">
      <router-link class="close-button" :to="closeRoute">
        <x-icon />
      </router-link>
    </div>

    <div class="flexrow">
      <people-avatar class="flexrow-item" :person="person" :is-lazy="false" />
      <page-title class="flexrow-item" :text="person.full_name" />
    </div>

    <div class="info-date" v-if="level === 'year'">{{ year }}</div>
    <div class="info-date" v-else-if="level === 'month'">
      {{ monthString }} {{ year }}
    </div>
    <div class="info-date" v-else-if="level === 'week'">
      {{ $t('main.week') }} {{ week }}, {{ weekDays }} {{ year }}
    </div>
    <div class="info-date" v-else>{{ day }} {{ monthString }} {{ year }}</div>

    <div class="info-day-off" v-if="level !== 'day'">
      {{ dayOffCount }}
      {{ $t('days_off.nb_days_off', { count: dayOffCount }) }}
    </div>

    <time-spent-task-list
      class="time-spent-list"
      :tasks="tasks"
      :is-loading="isLoading"
      :is-error="isLoadingError"
      :unit="unit"
    />
  </div>
</template>

<script setup>
// Imports
import { XIcon } from 'lucide-vue-next'
import moment from 'moment-timezone'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { monthToString } from '@/lib/time'

import TimeSpentTaskList from '@/components/lists/TimeSpentTaskList.vue'
import PageTitle from '@/components/widgets/PageTitle.vue'
import PeopleAvatar from '@/components/widgets/PeopleAvatar.vue'

// Composables
const route = useRoute()
const router = useRouter()

// Props
const props = defineProps({
  person: { type: Object, default: () => ({}) },
  year: { type: Number, default: 0 },
  month: { type: Number, default: 0 },
  week: { type: Number, default: 0 },
  day: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
  isLoadingError: { type: Boolean, default: false },
  tasks: { type: Array, default: () => [] },
  dayOffCount: { type: Number, default: 0 },
  unit: { type: String, default: 'hour' }
})

// Computed
// --------------------------------------------------------------------------
// the panel only shows on the `timesheets-<level>-person` routes
const level = computed(() => route.name.split('-')[1])
const monthString = computed(() => monthToString(props.month))

// Monday of the displayed ISO week, as aggregated by the backend
const weekDays = computed(() => {
  const start = moment(`${props.year}-${props.week}`, 'YYYY-W')
  const end = start.clone().add(6, 'days')
  return `${start.date()} - ${end.date()} ${start.format('MMM')}`
})

const closeRoute = computed(() => {
  const { year, month, week, day } = props
  const params = {
    year: { year },
    month: { year, month },
    week: { year, week },
    day: { year, month, day }
  }[level.value]
  return {
    name: `timesheets-${level.value}`,
    params,
    query: {
      productionId: route.query.productionId,
      studioId: route.query.studioId
    }
  }
})

// Functions
// --------------------------------------------------------------------------
const onKeyDown = event => {
  if (event.key === 'Escape') router.push(closeRoute.value)
}

// Lifecycle
// --------------------------------------------------------------------------
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style lang="scss" scoped>
.data-list {
  padding-bottom: 5em;
}

.people-timesheet-info {
  padding: 1.5em 1.5em 1em;
}

.info-date {
  font-size: 1.5em;
  margin-top: 1em;
  text-transform: capitalize;
}

.close {
  text-align: right;
}
</style>
