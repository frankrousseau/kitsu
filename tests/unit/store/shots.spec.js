import { vi } from 'vitest'

// Importing the shots module transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))

import shotsStore from '@/store/modules/shots'

describe('Shots store', () => {
  describe('loading flag lifecycle', () => {
    test('CLEAR_SHOTS resets the loading flag so a stale in-flight load cannot wedge the next one (BUG-4)', () => {
      const state = { isShotsLoading: true, isShotsLoadingError: true }
      shotsStore.mutations.CLEAR_SHOTS(state)
      expect(state.isShotsLoading).toBe(false)
      expect(state.isShotsLoadingError).toBe(false)
    })

    test('loadShots does not start a second load while one is in flight (BUG-4)', () => {
      const state = { isShotsLoading: true }
      const commit = vi.fn()
      const dispatch = vi.fn()
      const callback = vi.fn()
      const rootGetters = {
        currentProduction: { id: 'p1' },
        episodes: [],
        userFilters: {},
        userFilterGroups: {},
        taskTypeMap: new Map(),
        personMap: new Map(),
        taskMap: new Map(),
        isTVShow: false,
        currentEpisode: null
      }

      shotsStore.actions.loadShots({ commit, dispatch, state, rootGetters }, callback)

      // Guard fires the callback and bails without kicking off another load.
      expect(callback).toHaveBeenCalledTimes(1)
      expect(dispatch).not.toHaveBeenCalled()
      expect(commit.mock.calls.map(c => c[0])).not.toContain('LOAD_SHOTS_START')
    })
  })
})
