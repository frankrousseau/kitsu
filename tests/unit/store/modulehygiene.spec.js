import { vi } from 'vitest'

// Some module imports transitively pull the root store; stub it so no
// Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))

import departmentsStore from '@/store/modules/departments'
import taskStatusStore from '@/store/modules/taskstatus'
import taskTypesStore from '@/store/modules/tasktypes'

describe('store module hygiene', () => {
  describe('RESET_ALL clears the module caches (ARCH-9)', () => {
    test.each([
      ['tasktypes', taskTypesStore, 'taskTypeMap'],
      ['taskstatus', taskStatusStore, 'taskStatusMap'],
      ['departments', departmentsStore, 'departmentMap']
    ])('%s', (name, module, mapName) => {
      module.cache[mapName].set('x1', { id: 'x1', name: 'Leftover' })
      const state = {}
      module.mutations.RESET_ALL(state)
      // A leftover entry here leaks data from the previous session.
      expect(module.cache[mapName].size).toBe(0)
    })
  })

  describe('edit mutations keep lists sorted (ARCH-21)', () => {
    test('EDIT_DEPARTMENTS_END re-sorts after a rename', () => {
      const alpha = { id: 'd1', name: 'Alpha' }
      const zeta = { id: 'd2', name: 'Zeta' }
      const state = { departments: [alpha, zeta] }
      departmentsStore.cache.departmentMap = new Map([
        ['d1', alpha],
        ['d2', zeta]
      ])

      departmentsStore.mutations.EDIT_DEPARTMENTS_END(state, {
        id: 'd1',
        name: 'Zzz'
      })

      expect(state.departments.map(d => d.name)).toEqual(['Zeta', 'Zzz'])
    })

    test('EDIT_TASK_STATUS_END re-sorts after a rename', () => {
      const done = { id: 's1', name: 'Done' }
      const wip = { id: 's2', name: 'WIP' }
      const state = { taskStatuses: [done, wip] }
      taskStatusStore.cache.taskStatusMap = new Map([
        ['s1', done],
        ['s2', wip]
      ])

      taskStatusStore.mutations.EDIT_TASK_STATUS_END(state, {
        id: 's1',
        name: 'Zzz'
      })

      expect(state.taskStatuses.map(s => s.name)).toEqual(['WIP', 'Zzz'])
    })
  })
})
