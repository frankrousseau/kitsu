<template>
  <div class="timesheet-chart">
    <spinner class="spinner" v-if="isLoading" />
    <div class="loading-error" v-else-if="isError">
      {{ $t('main.loading_error') }}
    </div>
    <p class="empty" v-else-if="!people.length">{{ $t('timesheets.empty') }}</p>
    <template v-else>
      <div class="flexrow chart-header">
        <span class="flexrow-item legend-item">
          <span class="legend-bar"></span>
          {{ seriesName }}
        </span>
        <div class="filler"></div>
        <span class="flexrow-item total">{{ totalLabel }}</span>
      </div>
      <div class="chart-wrapper">
        <column-chart
          height="100%"
          :data="chartData"
          :decimal="decimalSeparator"
          :library="chartLibrary"
          :min="0"
          :round="unit === 'salary' ? 0 : 1"
          :thousands="thousandsSeparator"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
// Imports
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { useChartTheme } from '@/composables/chartTheme'
import {
  convertHours,
  formatTimesheetValue,
  getTimesheetColumns,
  isCurrentTimesheetColumn,
  timesheetColumnLabel
} from '@/lib/timesheet'

import Spinner from '@/components/widgets/Spinner.vue'

// Composables
const { t } = useI18n()
const store = useStore()
const { font, theme } = useChartTheme()

// Props
const props = defineProps({
  timesheet: { type: Object, default: () => ({}) },
  people: { type: Array, default: () => [] },
  detailLevel: { type: String, default: 'day' },
  year: { type: Number, default: 0 },
  month: { type: Number, default: 0 },
  unit: { type: String, default: 'hour' },
  dailyRates: { type: Object, default: () => ({}) },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false }
})

// Computed
// --------------------------------------------------------------------------
const firstYear = computed(() => store.getters.firstTimesheetYear)
const organisation = computed(() => store.getters.organisation)
const use12HourClock = computed(() => store.getters.use12HourClock)

// the same columns as the grid
const columns = computed(() =>
  getTimesheetColumns(props.detailLevel, {
    year: props.year,
    month: props.month,
    firstYear: firstYear.value
  })
)

const totals = computed(() =>
  columns.value.map(index =>
    props.people.reduce(
      (sum, person) =>
        sum +
        convertHours(
          (props.timesheet?.[index]?.[person.id] || 0) / 60,
          props.unit,
          organisation.value,
          props.dailyRates[person.id]
        ),
      0
    )
  )
)

const grandTotal = computed(() =>
  totals.value.reduce((sum, total) => sum + total, 0)
)

const totalKey = computed(
  () =>
    ({
      hour: 'main.hours_spent',
      day: 'main.days_spent',
      salary: 'timesheets.in_salary'
    })[props.unit]
)

const seriesName = computed(() => t(totalKey.value, { count: 2 }))

const totalLabel = computed(
  () =>
    `${format(grandTotal.value)} ${t(totalKey.value, { count: grandTotal.value })}`
)

// full colour, lighter under the pointer; the current period shows in
// its x label, as in the grid header
const chartData = computed(() => [
  {
    name: seriesName.value,
    color: '#00b242',
    data: columns.value.map((index, position) => [
      label(index),
      round(totals.value[position])
    ]),
    dataset: {
      backgroundColor: '#00b242',
      hoverBackgroundColor: '#33c168',
      borderRadius: 4,
      borderWidth: 0,
      maxBarThickness: 48
    }
  }
])

const chartLibrary = computed(() => ({
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      border: { color: theme.value.grid },
      grid: { display: false },
      ticks: {
        color: ({ index }) =>
          isCurrentColumn(columns.value[index]) ? '#00b242' : theme.value.muted,
        font,
        maxRotation: 0
      }
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: theme.value.grid },
      ticks: { color: theme.value.muted, font }
    }
  }
}))

// chartkick formats the tooltips itself, from the user's separators
const thousandsSeparator = computed(() => (use12HourClock.value ? ',' : ' '))
const decimalSeparator = computed(() => (use12HourClock.value ? '.' : ','))

// Functions
// --------------------------------------------------------------------------
const round = value =>
  props.unit === 'salary' ? Math.round(value) : Math.round(value * 10) / 10

const format = value =>
  formatTimesheetValue(value, props.unit, use12HourClock.value)

const label = index => timesheetColumnLabel(props.detailLevel, index)

const isCurrentColumn = index =>
  isCurrentTimesheetColumn(props.detailLevel, index, {
    year: props.year,
    month: props.month
  })
</script>

<style lang="scss" scoped>
.timesheet-chart {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1em;
  min-height: 0;
}

.chart-header {
  padding: 0 1em;
}

.legend-item {
  align-items: center;
  color: var(--text);
  display: inline-flex;
  font-size: 0.9em;
  gap: 0.5em;

  &::first-letter {
    text-transform: uppercase;
  }
}

.legend-bar {
  background: $green;
  border-radius: 2px;
  display: inline-block;
  height: 12px;
  width: 18px;
}

.total {
  color: var(--text);
  font-weight: 600;
}

.chart-wrapper {
  background: var(--background-alt);
  border-radius: 10px;
  flex: 1;
  min-height: 250px;
  padding: 2.5em;
}

.spinner {
  margin: 2em auto;
}

.loading-error {
  color: $red;
  margin-top: 2em;
  text-align: center;
}

.empty {
  color: var(--text);
  font-size: 1.2rem;
  font-style: italic;
  padding-top: 30px;
  text-align: center;
}
</style>
