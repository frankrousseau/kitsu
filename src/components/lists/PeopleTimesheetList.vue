<template>
  <div class="data-list">
    <div
      class="datatable-wrapper"
      ref="body"
      @mousedown="startBrowsing"
      @touchstart="startBrowsing"
    >
      <table class="datatable">
        <thead class="datatable-head">
          <tr>
            <th scope="col" class="name datatable-row-header">
              {{ $t('people.list.name') }}
            </th>

            <!-- Year columns -->
            <template v-if="detailLevel === 'year'">
              <th
                :key="`year-${year}`"
                scope="col"
                class="time year"
                v-for="year in yearRange"
              >
                {{ year }}
              </th>
            </template>

            <!-- Month columns -->
            <template v-if="detailLevel === 'month'">
              <th
                :key="`month-${month}`"
                scope="col"
                class="time month"
                v-for="month in monthRange"
              >
                {{ monthToString(month) }}
              </th>
            </template>

            <!-- Week columns -->
            <template v-if="detailLevel === 'week'">
              <th
                :key="`week-${week}`"
                scope="col"
                class="daytime"
                :title="getWeekTitle(week)"
                v-for="week in weekRange"
              >
                {{ week }}
              </th>
            </template>

            <!-- Day columns -->
            <template v-if="detailLevel === 'day'">
              <th
                :key="`day-${day}`"
                scope="col"
                class="daytime"
                v-for="day in dayRange"
              >
                {{ day }}
              </th>
            </template>
            <th scope="col" class="actions"></th>
          </tr>
        </thead>
        <tbody class="datatable-body" v-if="!isLoading">
          <tr class="datatable-row" v-for="person in people" :key="person.id">
            <th class="datatable-row-header name">
              <div class="flexrow">
                <people-avatar class="flexrow-item" :person="person" />
                <people-name class="flexrow-item" with-link :person="person" />
              </div>
            </th>

            <!-- Year cells -->
            <template v-if="detailLevel === 'year'">
              <td
                :key="`year-${year}-${person.id}`"
                class="time year"
                :class="{ selected: isSelected(person.id, { year }) }"
                v-for="year in yearRange"
              >
                <router-link
                  v-if="duration(year, person.id) > 0"
                  class="duration"
                  :class="{ warning: isOvertime(year, person.id) }"
                  :to="getDetailRoute(person, { year })"
                >
                  {{ duration(year, person.id) }}
                </router-link>
                <template v-else> - </template>
              </td>
            </template>

            <!-- Month cells -->
            <template v-if="detailLevel === 'month'">
              <td
                :key="`month-${month}-${person.id}`"
                class="time month"
                :class="{ selected: isSelected(person.id, { year, month }) }"
                v-for="month in monthRange"
              >
                <router-link
                  v-if="duration(month, person.id) > 0"
                  class="duration"
                  :class="{ warning: isOvertime(month, person.id) }"
                  :to="getDetailRoute(person, { year, month })"
                >
                  {{ duration(month, person.id) }}
                </router-link>
                <template v-else> - </template>
              </td>
            </template>

            <!-- Week cells -->
            <template v-if="detailLevel === 'week'">
              <td
                :key="`week-${week}-${person.id}`"
                class="daytime"
                :class="{ selected: isSelected(person.id, { year, week }) }"
                v-for="week in weekRange"
              >
                <router-link
                  v-if="duration(week, person.id) > 0"
                  class="duration"
                  :class="{ warning: isOvertime(week, person.id) }"
                  :to="getDetailRoute(person, { year, week })"
                >
                  {{ duration(week, person.id) }}
                </router-link>
                <template v-else> - </template>
              </td>
            </template>

            <!-- Day cells -->
            <template v-if="detailLevel === 'day'">
              <td
                :key="`day-${day}-${person.id}`"
                class="daytime"
                :class="{
                  weekend: isWeekend(year, month, day),
                  selected: isSelected(person.id, { year, month, day })
                }"
                v-for="day in dayRange"
              >
                <template v-if="isDayOff(person.id, day)">
                  {{ $t('timesheets.off').toUpperCase() }}
                </template>
                <router-link
                  v-else-if="duration(day, person.id) > 0"
                  class="duration"
                  :class="{ warning: isOvertime(day, person.id) }"
                  :to="getDetailRoute(person, { year, month, day })"
                >
                  {{ duration(day, person.id) }}
                </router-link>
                <template v-else> - </template>
              </td>
            </template>
            <td class="actions"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <table-info :is-loading="isLoading" :is-error="isError" variant="grid" />

    <p class="empty" v-if="!isLoading && !isError && !people.length">
      {{ $t('timesheets.empty') }}
    </p>

    <p class="has-text-centered footer-info" v-if="!isLoading && people.length">
      {{ people.length }} {{ $t('people.persons', { count: people.length }) }}
    </p>
  </div>
</template>

<script setup>
// Imports
import moment from 'moment-timezone'
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { useGrabList } from '@/composables/grabList'
import {
  formatDisplayDate,
  getBusinessDays,
  getDayRange,
  getMonthRange,
  getWeekRange,
  hoursToDays,
  monthToString,
  range
} from '@/lib/time'

import PeopleAvatar from '@/components/widgets/PeopleAvatar.vue'
import PeopleName from '@/components/widgets/PeopleName.vue'
import TableInfo from '@/components/widgets/TableInfo.vue'

// Composables
const route = useRoute()
const store = useStore()
const bodyRef = useTemplateRef('body')
const { startBrowsing } = useGrabList(bodyRef)

// Props
const props = defineProps({
  timesheet: { type: Object, default: () => ({}) },
  people: { type: Array, default: () => [] },
  detailLevel: { type: String, default: 'day' },
  year: { type: Number, default: 0 },
  month: { type: Number, default: 0 },
  unit: { type: String, default: 'hour' },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false }
})

// State
// --------------------------------------------------------------------------
const currentMonth = moment().month() + 1
const currentYear = moment().year()

// Computed
// --------------------------------------------------------------------------
const dateFormat = computed(() => store.getters.dateFormat)
const dayOffMap = computed(() => store.getters.dayOffMap)
const organisation = computed(() => store.getters.organisation)
const firstYear = computed(() => store.getters.firstTimesheetYear)

const yearRange = computed(() => range(firstYear.value, currentYear))
const monthRange = computed(() =>
  getMonthRange(props.year, currentYear, currentMonth)
)
const weekRange = computed(() => getWeekRange(props.year, currentYear))
const dayRange = computed(() =>
  getDayRange(props.year, props.month, currentYear, currentMonth)
)

// hours a full-time person is expected to log per column: the day rate
// over the working days the column spans (Monday to Friday, days off
// ignored, which only makes the threshold more lenient)
const expectedHours = computed(() => {
  const hpd = organisation.value.hours_by_day
  const ranges = {
    year: yearRange,
    month: monthRange,
    week: weekRange,
    day: dayRange
  }
  const expected = index => {
    if (props.detailLevel === 'day') return hpd
    if (props.detailLevel === 'week') return 5 * hpd
    const start =
      props.detailLevel === 'year'
        ? moment({ year: index })
        : moment({ year: props.year, month: index - 1 })
    const end = start.clone().endOf(props.detailLevel)
    return getBusinessDays(start, end) * hpd
  }
  return Object.fromEntries(
    ranges[props.detailLevel].value.map(index => [index, expected(index)])
  )
})

// Functions
// --------------------------------------------------------------------------
const hours = (index, personId) =>
  (props.timesheet?.[index]?.[personId] || 0) / 60

// selected unit, one decimal max without padding; empty cells show '-'
const duration = (index, personId) => {
  const logged = hours(index, personId)
  if (!logged) return '-'
  const value =
    props.unit === 'hour' ? logged : hoursToDays(organisation.value, logged)
  return Math.round(value * 10) / 10
}

const isOvertime = (index, personId) =>
  hours(index, personId) > expectedHours.value[index]

const isDayOff = (personId, day) =>
  dayOffMap.value[personId]?.[`${day}`.padStart(2, '0')] === true

const isWeekend = (year, month, day) =>
  [0, 6].includes(moment(`${year}-${month}-${day}`, 'YYYY-M-D').day())

const isSelected = (personId, params) =>
  route.params.person_id === personId &&
  Object.entries(params).every(
    ([key, value]) => parseInt(route.params[key]) === value
  )

const getDetailRoute = (person, params) => ({
  name: `timesheets-${props.detailLevel}-person`,
  params: { person_id: person.id, ...params },
  query: {
    productionId: route.query.productionId,
    studioId: route.query.studioId
  }
})

const getWeekTitle = week => {
  const beginning = moment(`${props.year}-${week}`, 'YYYY-W')
  const end = beginning.clone().add(6, 'days')
  const format = date => formatDisplayDate(date, dateFormat.value)
  return `${format(beginning)} - ${format(end)}`
}

// Watchers
// --------------------------------------------------------------------------
// opening the side column takes 400px from the wrapper, which can push the
// clicked cell out of view: wait for the resize, then scroll it back
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    bodyRef.value
      ?.querySelector('.selected')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
)
</script>

<style lang="scss" scoped>
.datatable {
  // auto layout recomputes column widths from the cell contents at every
  // reload (the tbody unmounts while loading), which makes the columns
  // jitter: fixed layout sizes them from the header row once
  table-layout: fixed;
  width: 100%;
}

.datatable-body tr:first-child th,
.datatable-body tr:first-child td {
  border-top: 0;
}

.name {
  overflow: hidden;
  width: 230px;
  min-width: 230px;
}

.time {
  width: 70px;
  min-width: 70px;

  &.month {
    width: 80px;
    min-width: 80px;
  }

  &.year {
    width: 90px;
    min-width: 90px;
  }
}

.daytime {
  width: 60px;
  min-width: 60px;
}

.time,
.daytime {
  text-align: center;
  vertical-align: middle;
}

th.actions {
  padding: 0;
  width: 100%;
  min-width: auto;
}

// the admin lists' empty row, kept out of the table so the text stays
// centered in the viewport when the grid is wider than it
.empty {
  color: var(--text);
  font-size: 1.2rem;
  font-style: italic;
  padding-top: 30px;
  text-align: center;
}

a,
a:hover {
  color: inherit;
}

// logged hours above the expected ones for the column
.duration.warning {
  background: rgba($red, 0.15);
  color: $red;

  &:hover {
    background: rgba($red, 0.25);
  }
}

// translucent so the cell keeps the row striping and the hover colour
// underneath, in both themes. The global last-row rule paints cell
// backgrounds, so the row must be in the selector to win there too
.datatable-row td.weekend {
  background-color: rgba(0, 0, 0, 0.045);
}

.dark .datatable-row td.weekend {
  background-color: rgba(0, 0, 0, 0.16);
}

.duration:hover {
  background: var(--background-selectable);
}

.selected .duration {
  background: var(--background-selected);

  &:hover {
    background: var(--background-selected);
    cursor: default;
  }
}

.duration {
  border-radius: 0.3em;
  color: var(--text-strong);
  font-weight: 600;
  outline: none;
  padding: 0.5em;

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--background-selectable);
  }
}

.selected .duration.warning {
  background: $red;
  color: $black;
}
</style>
