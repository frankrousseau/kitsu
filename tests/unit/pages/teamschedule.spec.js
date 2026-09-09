import { nextTick } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createStore } from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@unhead/vue', () => ({ useHead: vi.fn() }))
vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal()),
  useI18n: () => ({ t: key => key })
}))

// Pre-load the real store to avoid circular-import race from child components.
import '@/lib/auth'

import TeamSchedule from '@/components/pages/TeamSchedule.vue'

const ScheduleStub = {
  template: '<div />',
  methods: {
    scrollToToday: () => {}
  }
}

const emptyPage = { data: [], is_more: false, stats: { total: 0 } }

const mountPage = async ({
  getters = {},
  actions = {},
  mutations = {},
  state = {}
} = {}) => {
  const socket = { on: vi.fn(), off: vi.fn() }
  const store = createStore({
    state,
    mutations,
    getters: {
      daysOff: () => [],
      departmentMap: () => new Map(),
      displayedPeople: () => [],
      getProductionTaskTypes: () => () => [],
      isCurrentUserManager: () => true,
      openProductions: () => [],
      organisation: () => ({}),
      productionMap: () => new Map(),
      taskTypeMap: () => new Map(),
      user: () => ({ id: 'user-1', departments: [] }),
      ...getters
    },
    actions: {
      getPersonsTasksDates: vi.fn(() => []),
      loadDaysOff: vi.fn(),
      loadOpenTasks: vi.fn(() => emptyPage),
      loadPeople: vi.fn(),
      ...actions
    }
  })
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })
  const wrapper = shallowMount(TeamSchedule, {
    global: {
      plugins: [
        store,
        router,
        {
          install: app => {
            app.config.globalProperties.$socket = socket
            app.config.globalProperties.$t = key => key
          }
        }
      ],
      stubs: { Schedule: ScheduleStub }
    }
  })
  await nextTick()
  const handler = socket.on.mock.calls.find(
    ([event]) => event === 'preview-file:set-main'
  )[1]
  return { wrapper, socket, handler }
}

const supervisorGetters = {
  isCurrentUserManager: () => false,
  user: () => ({ id: 'user-1', departments: ['dep-1'] })
}

describe('TeamSchedule page', () => {
  describe('initial load', () => {
    const people = [
      { id: 'person-1', name: 'Ann', departments: ['dep-1'], is_bot: false }
    ]
    const personDates = [
      {
        person_id: 'person-1',
        min_date: '2026-09-01',
        max_date: '2026-09-30',
        busy_periods: []
      }
    ]
    const scheduleStarts = wrapper =>
      wrapper.vm.scheduleItems.map(item => item.startDate.format('YYYY-MM-DD'))

    // The window ends at today plus three months: freeze the clock so the
    // expectations stay literal, and silence the errors the failure paths log.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-09T12:00:00Z'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    // Zou serves GET /data/day-offs to admins only: the refusal used to
    // abort init() before the person dates reached the schedule, which then
    // stayed blank until a filter change rebuilt it.
    it('fills the schedule of a supervisor when the days off are refused', async () => {
      const { wrapper } = await mountPage({
        getters: { ...supervisorGetters, displayedPeople: () => people },
        actions: {
          getPersonsTasksDates: vi.fn(() => personDates),
          loadDaysOff: vi.fn(() => Promise.reject(new Error('403')))
        }
      })
      await flushPromises()

      expect(wrapper.vm.errors.schedule).toBe(false)
      expect(wrapper.vm.loading.schedule).toBe(false)
      expect(scheduleStarts(wrapper)).toEqual(['2026-09-01'])
      wrapper.unmount()
    })

    it('fills the schedule of a manager when the days off are refused', async () => {
      const { wrapper } = await mountPage({
        getters: { displayedPeople: () => people },
        actions: {
          getPersonsTasksDates: vi.fn(() => personDates),
          loadDaysOff: vi.fn(() => Promise.reject(new Error('403')))
        }
      })
      await flushPromises()

      expect(scheduleStarts(wrapper)).toEqual(['2026-09-01'])
      wrapper.unmount()
    })

    // The mount-time filter watchers fire before the person dates exist:
    // on a warm store the timeline flashed one-day bars at today.
    it('waits for the person dates before building the schedule', async () => {
      let resolveDates
      const { wrapper } = await mountPage({
        getters: { ...supervisorGetters, displayedPeople: () => people },
        actions: {
          getPersonsTasksDates: vi.fn(
            () =>
              new Promise(resolve => {
                resolveDates = resolve
              })
          )
        }
      })
      await flushPromises()

      expect(wrapper.vm.scheduleItems).toEqual([])

      resolveDates(personDates)
      await flushPromises()

      expect(scheduleStarts(wrapper)).toEqual(['2026-09-01'])
      wrapper.unmount()
    })

    // Zou scopes the studio-wide month route to the persons the caller may
    // read: the page asks for the months of its window rather than the
    // admin-only listing.
    it('loads the days off of the displayed window', async () => {
      const loadDaysOff = vi.fn()
      const { wrapper } = await mountPage({
        getters: { displayedPeople: () => people },
        actions: {
          getPersonsTasksDates: vi.fn(() => personDates),
          loadDaysOff
        }
      })
      await flushPromises()

      const [, { startDate, endDate }] = loadDaysOff.mock.calls[0]
      expect(startDate.format('YYYY-MM-DD')).toBe('2026-09-01')
      expect(endDate.format('YYYY-MM-DD')).toBe('2026-12-09')
      wrapper.unmount()
    })

    // The root items carry the days off of their person and are patched in
    // place: a rebuild would collapse the expanded rows.
    it('reloads the days off when the window changes', async () => {
      const dayOff = {
        id: 'off-1',
        person_id: 'person-1',
        date: '2027-01-04',
        end_date: '2027-01-05'
      }
      // the initial window ends on 2026-12-09
      const loadDaysOff = vi.fn(({ commit }, { endDate }) => {
        commit('PEOPLE_SET_DAYS_OFF', endDate.isAfter('2026-12-31') ? [dayOff] : [])
      })
      const { wrapper } = await mountPage({
        state: { daysOff: [] },
        mutations: {
          PEOPLE_SET_DAYS_OFF: (state, daysOff) => {
            state.daysOff = daysOff
          }
        },
        getters: {
          daysOff: state => state.daysOff,
          displayedPeople: () => people
        },
        actions: {
          getPersonsTasksDates: vi.fn(() => personDates),
          loadDaysOff
        }
      })
      await flushPromises()
      const row = wrapper.vm.scheduleItems[0]
      expect(row.daysOff).toBeUndefined()
      row.expanded = true

      wrapper.vm.onUpdateSelectedEndDate('2027-01-15')
      await flushPromises()

      expect(loadDaysOff).toHaveBeenCalledTimes(2)
      expect(wrapper.vm.scheduleItems[0]).toBe(row)
      expect(row.expanded).toBe(true)
      expect(row.daysOff).toEqual([dayOff])

      wrapper.vm.onUpdateSelectedStartDate('2026-08-01')
      await flushPromises()

      const [, window] = loadDaysOff.mock.calls[2]
      expect(window.startDate.format('YYYY-MM-DD')).toBe('2026-08-01')
      expect(window.endDate.format('YYYY-MM-DD')).toBe('2027-01-15')
      wrapper.unmount()
    })

    it('shows an error state with a reload when the person dates fail', async () => {
      const getPersonsTasksDates = vi
        .fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValue(personDates)
      const { wrapper } = await mountPage({
        getters: { displayedPeople: () => people },
        actions: { getPersonsTasksDates }
      })
      await flushPromises()

      expect(wrapper.vm.errors.schedule).toBe(true)
      expect(wrapper.vm.loading.schedule).toBe(false)
      expect(wrapper.findComponent(ScheduleStub).exists()).toBe(false)
      expect(wrapper.find('.schedule-error').exists()).toBe(true)

      await wrapper.find('.schedule-error button-simple-stub').trigger('click')
      await flushPromises()

      expect(wrapper.vm.errors.schedule).toBe(false)
      expect(scheduleStarts(wrapper)).toEqual(['2026-09-01'])
      expect(wrapper.find('.schedule-error').exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('preview-file:set-main socket handler', () => {
    // The unassigned tasks are enriched copies kept in component state, so
    // no store mutation can refresh their thumbnail.
    it('refreshes the thumbnail of the tasks of the entity', async () => {
      const { wrapper, handler } = await mountPage()
      wrapper.vm.unassignedTasks = [
        { id: 'task-1', entity_id: 'entity-1', entity_preview_file_id: '' },
        { id: 'task-2', entity_id: 'entity-1', entity_preview_file_id: 'old' },
        { id: 'task-3', entity_id: 'entity-2', entity_preview_file_id: 'old' }
      ]

      handler({ entity_id: 'entity-1', preview_file_id: 'preview-1' })

      expect(
        wrapper.vm.unassignedTasks.map(task => task.entity_preview_file_id)
      ).toEqual(['preview-1', 'preview-1', 'old'])
      wrapper.unmount()
    })

    it('ignores an entity absent from the panel', async () => {
      const { wrapper, handler } = await mountPage()
      wrapper.vm.unassignedTasks = [
        { id: 'task-1', entity_id: 'entity-1', entity_preview_file_id: 'old' }
      ]

      handler({ entity_id: 'entity-9', preview_file_id: 'preview-1' })

      expect(wrapper.vm.unassignedTasks[0].entity_preview_file_id).toEqual(
        'old'
      )
      wrapper.unmount()
    })

    it('is unregistered on unmount', async () => {
      const { wrapper, socket, handler } = await mountPage()
      wrapper.unmount()
      expect(socket.off).toHaveBeenCalledWith('preview-file:set-main', handler)
    })
  })
})
