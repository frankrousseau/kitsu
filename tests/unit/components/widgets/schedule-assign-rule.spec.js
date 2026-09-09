import { mount } from '@vue/test-utils'
import moment from 'moment'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vuex', () => ({
  useStore: () => ({
    getters: {
      currentProduction: { id: 'production-1', name: 'Production' },
      dateFormat: 'YYYY-MM-DD',
      // the person row renders its departments
      departmentMap: new Map([
        ['dep-2', { id: 'dep-2', name: 'Lighting', color: '#222222' }]
      ]),
      isCurrentUserProductionManager: true,
      isDarkTheme: false,
      milestones: [],
      openProductions: [{ id: 'production-1', team: ['person-1'] }],
      organisation: { hours_by_day: 8 },
      taskMap: new Map(),
      taskStatuses: []
    },
    dispatch: vi.fn()
  })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: key => key })
}))

import Schedule from '@/components/widgets/Schedule.vue'

const person = {
  id: 'person-1',
  name: 'Ann',
  departments: ['dep-2'],
  color: '#888888',
  editable: true,
  expanded: true,
  loading: false,
  man_days: 0,
  daysOff: [],
  startDate: moment('2026-09-01'),
  endDate: moment('2026-09-30'),
  children: []
}
const task = { id: 'task-1', project_id: 'production-1', department: null }

const mountSchedule = (props = {}) =>
  mount(Schedule, {
    props: {
      startDate: moment('2026-08-01'),
      endDate: moment('2026-10-31'),
      hierarchy: [person],
      zoomLevel: 1,
      withMilestones: false,
      isLoading: false,
      ...props
    },
    // The root and child links are v-if'd out (the fixture carries no route),
    // yet Vue still resolves router-link at the top of the render fn.
    global: { stubs: { RouterLink: true } }
  })

describe('Schedule widget - assignRule page rule', () => {
  it('lets the drop through without a page rule', () => {
    const wrapper = mountSchedule()

    expect(wrapper.vm.getDropForbiddenReason(task, person)).toBe(null)
    wrapper.unmount()
  })

  it('lets the drop through when the rule returns no reason', () => {
    const wrapper = mountSchedule({ assignRule: () => null })

    expect(wrapper.vm.getDropForbiddenReason(task, person)).toBe(null)
    wrapper.unmount()
  })

  it('refuses the drop with the reason the rule returns', () => {
    const assignRule = vi.fn(() => 'role')
    const wrapper = mountSchedule({ assignRule })

    expect(wrapper.vm.getDropForbiddenReason(task, person)).toBe('role')
    expect(assignRule).toHaveBeenCalledWith(task, person)
    wrapper.unmount()
  })

  it('asks the rule only after the team check', () => {
    const assignRule = vi.fn(() => 'role')
    const wrapper = mountSchedule({ assignRule })

    expect(
      wrapper.vm.getDropForbiddenReason(task, { ...person, id: 'person-9' })
    ).toBe('team')
    expect(assignRule).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('flags the hovered row with the reason on drag enter', async () => {
    const wrapper = mountSchedule({
      assignRule: () => 'task_type',
      draggedItems: [task]
    })
    // the entity panel has its own .children block: aim at the timeline row
    const row = wrapper.find('.children[data-root-element-id]')
    // VTU trigger cannot attach dataTransfer to a jsdom event
    const event = new Event('dragenter', { bubbles: true })
    Object.defineProperty(event, 'dataTransfer', { value: { types: [] } })
    row.element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.dropTarget.forbidden).toBe('task_type')
    expect(wrapper.vm.dropTarget.rootElementId).toBe('person-1')
    expect(wrapper.find('.drop-forbidden-message').text()).toContain(
      'schedule.drop_forbidden_task_type'
    )
    wrapper.unmount()
  })
})
