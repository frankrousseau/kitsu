import { vi } from 'vitest'

// Importing the shots module transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('@/store/api/shots', () => ({
  default: { getShots: vi.fn() }
}))

import shotsApi from '@/store/api/shots'
import shotsStore from '@/store/modules/shots'

describe('Shots store', () => {
  describe('loadShots while a load is in flight', () => {
    const rootGetters = {
      currentProduction: { id: 'production-1' },
      currentEpisode: null,
      episodes: [],
      userFilters: {},
      userFilterGroups: {},
      taskTypeMap: new Map(),
      taskMap: new Map(),
      personMap: new Map(),
      isTVShow: false
    }

    test('queued callbacks run once the in-flight load settles', async () => {
      let resolveGetShots
      shotsApi.getShots.mockReturnValue(
        new Promise(resolve => {
          resolveGetShots = resolve
        })
      )

      const state = { isShotsLoading: false }
      const context = {
        state,
        commit: vi.fn(),
        dispatch: vi.fn().mockResolvedValue(),
        rootGetters
      }

      const firstLoad = shotsStore.actions.loadShots(context)
      state.isShotsLoading = true

      const queuedCallback = vi.fn()
      const secondLoad = shotsStore.actions.loadShots(context, queuedCallback)
      expect(queuedCallback).not.toHaveBeenCalled()

      resolveGetShots([])
      await firstLoad
      await secondLoad
      expect(queuedCallback).toHaveBeenCalled()
    })
  })
})
