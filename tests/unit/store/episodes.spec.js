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

  describe('ADD_EPISODE', () => {
    // The Episodes page loads its rows with tasks into cache.episodes while
    // state.episodes keeps the plain list the topbar loaded: a live episode
    // must not replace one dataset by the other.
    test('keeps the with-tasks dataset of the Episodes page', () => {
      const state = { episodes: [], displayedEpisodes: [] }
      episodesStore.mutations.LOAD_EPISODES_END(state, {
        episodes: [{ id: 'episode-1', name: 'E01', status: 'running' }],
        routeEpisodeId: 'episode-1'
      })
      episodesStore.mutations.SET_EPISODES_WITH_TASKS(state, {
        production: { id: 'production-1', name: 'Prod' },
        episodes: [
          {
            id: 'episode-1',
            name: 'E01',
            status: 'running',
            tasks: [],
            data: {}
          }
        ],
        userFilters: {},
        taskMap: new Map(),
        taskTypeMap: new Map(),
        personMap: new Map(),
        taskStatusMap: new Map()
      })
      const withTasks = episodesStore.cache.episodes[0]
      expect(withTasks.validations).toBeInstanceOf(Map)

      episodesStore.mutations.ADD_EPISODE(state, {
        id: 'episode-2',
        name: 'E02',
        status: 'running'
      })

      expect(episodesStore.cache.episodes[0]).toBe(withTasks)
      expect(state.episodes.map(({ id }) => id)).toEqual([
        'episode-1',
        'episode-2'
      ])
      expect(state.displayedEpisodes.map(({ id }) => id)).toEqual([
        'episode-1',
        'episode-2'
      ])
    })
  })

  describe('REMOVE_EPISODE', () => {
    // The topbar validates route episodes against the episodes getter: a
    // deleted episode must leave that list too, not only the map.
    test('drops the episode from the episodes list', () => {
      const state = { episodes: [] }
      episodesStore.mutations.LOAD_EPISODES_END(state, {
        episodes: [
          { id: 'episode-1', name: 'E01', status: 'running' },
          { id: 'episode-2', name: 'E02', status: 'running' }
        ],
        routeEpisodeId: 'episode-1'
      })
      episodesStore.mutations.REMOVE_EPISODE(state, { id: 'episode-2' })
      expect(state.episodes.map(({ id }) => id)).toEqual(['episode-1'])
    })

    test('keeps an episode added live', () => {
      const state = { episodes: [], displayedEpisodes: [] }
      episodesStore.mutations.LOAD_EPISODES_END(state, {
        episodes: [
          { id: 'episode-1', name: 'E01', status: 'running' },
          { id: 'episode-2', name: 'E02', status: 'running' }
        ],
        routeEpisodeId: 'episode-1'
      })
      episodesStore.mutations.ADD_EPISODE(state, {
        id: 'episode-3',
        name: 'E03',
        status: 'running'
      })
      episodesStore.mutations.REMOVE_EPISODE(state, { id: 'episode-1' })
      expect(state.episodes.map(({ id }) => id)).toEqual([
        'episode-2',
        'episode-3'
      ])
    })
  })
})
