// @vitest-environment node

import { vi } from 'vitest'

// Importing the episodes module transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('@/store/api/shots', () => ({ default: { getEpisodes: vi.fn() } }))

import shotsApi from '@/store/api/shots'
import episodesStore from '@/store/modules/episodes'

describe('Episodes store', () => {
  describe('LOAD_EPISODES_END with no episodes', () => {
    test.each(['all', 'main'])(
      'resolves the %s pseudo-episode from the route',
      routeEpisodeId => {
        const state = { episodes: [] }
        episodesStore.mutations.LOAD_EPISODES_END(state, {
          episodes: [],
          routeEpisodeId
        })
        expect(state.currentEpisode).toEqual({ id: routeEpisodeId })
      }
    )

    test('keeps currentEpisode null without a route episode', () => {
      const state = { episodes: [] }
      episodesStore.mutations.LOAD_EPISODES_END(state, {
        episodes: [],
        routeEpisodeId: undefined
      })
      expect(state.currentEpisode).toBeNull()
    })
  })

  describe('loadEpisodes', () => {
    // The user can change episode while the list is being fetched: the
    // episode resolved from the route must be the one of the response time,
    // not a snapshot taken at dispatch.
    test('resolves the route episode once the response is in', async () => {
      const production = { id: 'production-1' }
      const route = { params: { episode_id: 'episode-1' } }
      const rootGetters = {
        currentProduction: production,
        route,
        userFilters: {}
      }
      const commit = vi.fn()
      let resolveEpisodes
      shotsApi.getEpisodes.mockReturnValue(
        new Promise(resolve => {
          resolveEpisodes = resolve
        })
      )

      const loading = episodesStore.actions.loadEpisodes({
        commit,
        state: {},
        rootGetters
      })
      route.params = { episode_id: 'episode-2' }
      resolveEpisodes([{ id: 'episode-1' }, { id: 'episode-2' }])
      await loading

      expect(commit).toHaveBeenCalledWith(
        'LOAD_EPISODES_END',
        expect.objectContaining({ routeEpisodeId: 'episode-2' })
      )
    })
  })
})
