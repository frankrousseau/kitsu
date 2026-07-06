/*
 * Set of functions to facilitate usage of a date and timezones.
 */
import { computed } from 'vue'
import { useStore } from 'vuex'
import moment from 'moment-timezone'

import {
  formatFullDateWithTimezone,
  formatTimeOfDay,
  formatVerboseDate
} from '@/lib/time'

export function useTime() {
  const store = useStore()

  const timezone = computed(
    () => store.getters.user?.timezone || moment.tz.guess()
  )

  const use12HourClock = computed(() => store.getters.use12HourClock)

  const dateFormat = computed(() => store.getters.dateFormat)

  const today = computed(() => moment().toDate())

  const tomorrow = computed(() => moment().add(1, 'day').toDate())

  function formatDate(eventDate) {
    return formatFullDateWithTimezone(eventDate, timezone.value)
  }

  function formatTime(eventDate) {
    return formatTimeOfDay(
      moment.tz(eventDate, 'UTC').tz(timezone.value),
      use12HourClock.value
    )
  }

  function formatDay(eventDate) {
    return formatVerboseDate(
      moment.tz(eventDate, 'UTC').tz(timezone.value),
      dateFormat.value
    )
  }

  return {
    timezone,
    use12HourClock,
    dateFormat,
    today,
    tomorrow,
    formatDate,
    formatTime,
    formatDay
  }
}
