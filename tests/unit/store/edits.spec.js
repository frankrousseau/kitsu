import { vi } from 'vitest'

// Importing the edits module transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))
// Keep the loads in flight without hitting the network.
vi.mock('@/store/api/edits', () => ({
  default: { getEdits: vi.fn(() => new Promise(() => {})) }
}))

import editsStore from '@/store/modules/edits'

describe('Edits store', () => {
  describe('loading flag lifecycle', () => {
    test('a concurrent same-scope caller shares the in-flight load instead of starting a second one', () => {
      const state = { isEditsLoading: false }
      const commit = vi.fn()
      const dispatch = vi.fn()
      const rootGetters = {
        currentProduction: { id: 'p-share' },
        episodes: [],
        userFilters: {},
        taskTypeMap: new Map(),
        taskMap: new Map(),
        personMap: new Map(),
        isTVShow: false,
        currentEpisode: null
      }

      // First call kicks off the load and stores the in-flight promise/key.
      const first = editsStore.actions.loadEdits({
        commit,
        dispatch,
        state,
        rootGetters
      })
      expect(commit.mock.calls.map(c => c[0])).toContain('LOAD_EDITS_START')

      // Simulate the mutation the mocked commit did not apply.
      state.isEditsLoading = true
      commit.mockClear()

      // A concurrent caller for the same production+episode must get the very
      // same promise and must not start a second load.
      const second = editsStore.actions.loadEdits({
        commit,
        dispatch,
        state,
        rootGetters
      })
      expect(second).toBe(first)
      expect(commit.mock.calls.map(c => c[0])).not.toContain('LOAD_EDITS_START')
    })

    test('a caller for a different episode does not adopt the in-flight load', () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      const baseGetters = {
        currentProduction: { id: 'p-switch' },
        episodes: [{ id: 'ep-a' }, { id: 'ep-b' }],
        userFilters: {},
        taskTypeMap: new Map(),
        taskMap: new Map(),
        personMap: new Map(),
        isTVShow: true
      }
      const state = { isEditsLoading: false }

      // Load episode A, then leave it in flight.
      const loadA = editsStore.actions.loadEdits({
        commit,
        dispatch,
        state,
        rootGetters: { ...baseGetters, currentEpisode: { id: 'ep-a' } }
      })
      state.isEditsLoading = true
      commit.mockClear()

      // Switching to episode B must NOT return A's promise: B would await a
      // load whose result belongs to A and read stale edits. Instead B gets a
      // distinct promise that fetches B once A settles.
      const loadB = editsStore.actions.loadEdits({
        commit,
        dispatch,
        state,
        rootGetters: { ...baseGetters, currentEpisode: { id: 'ep-b' } }
      })
      expect(loadB).not.toBe(loadA)
      expect(commit.mock.calls.map(c => c[0])).not.toContain('LOAD_EDITS_START')
    })
  })
})
