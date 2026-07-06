import { vi } from 'vitest'

// Importing the shots module transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('@/store/api/shots', () => ({ default: { getShots: vi.fn() } }))

import shotsApi from '@/store/api/shots'
import shotsStore from '@/store/modules/shots'

describe('Shots store', () => {
  describe('loading flag lifecycle', () => {
    test('CLEAR_SHOTS resets the loading flag so a stale in-flight load cannot wedge the next one (BUG-4)', () => {
      const state = { isShotsLoading: true, isShotsLoadingError: true }
      shotsStore.mutations.CLEAR_SHOTS(state)
      expect(state.isShotsLoading).toBe(false)
      expect(state.isShotsLoadingError).toBe(false)
    })

    test('loadShots does not start a second load while one is in flight (BUG-4)', async () => {
      const state = { isShotsLoading: true }
      const commit = vi.fn()
      const dispatch = vi.fn()
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

      // Guard resolves immediately without kicking off another load.
      await shotsStore.actions.loadShots({ commit, dispatch, state, rootGetters })

      expect(dispatch).not.toHaveBeenCalled()
      expect(commit.mock.calls.map(c => c[0])).not.toContain('LOAD_SHOTS_START')
    })

    test('concurrent callers share the in-flight load promise', async () => {
      let resolveGetShots
      shotsApi.getShots.mockReturnValue(
        new Promise(resolve => {
          resolveGetShots = resolve
        })
      )
      const state = { isShotsLoading: false }
      // Flip the loading flag like the real mutation would.
      const commit = vi.fn(type => {
        if (type === 'LOAD_SHOTS_START') state.isShotsLoading = true
      })
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
      const ctx = {
        commit,
        dispatch: vi.fn().mockResolvedValue(),
        state,
        rootGetters
      }

      const first = shotsStore.actions.loadShots(ctx)
      const settled = vi.fn()
      const second = shotsStore.actions.loadShots(ctx).then(settled)

      // The second caller must wait for the data, not resolve against the
      // still-empty cache (the Sequence Stats empty-on-first-load bug).
      await Promise.resolve()
      expect(settled).not.toHaveBeenCalled()
      expect(shotsApi.getShots).toHaveBeenCalledTimes(1)

      resolveGetShots([])
      await first
      await second
      expect(settled).toHaveBeenCalled()

      shotsStore.cache.shotsLoadingPromise = null
    })
  })
})
