import { vi } from 'vitest'

import '@/lib/auth'

import Playlist from '@/components/pages/Playlist.vue'

describe('Playlist page', () => {
  const isStale = Playlist.computed.isPlaylistListStale
  const production = { id: 'p1' }
  const allShots = { project_id: 'p1', episode_id: null, is_for_all: true, for_entity: 'shot' }
  const allAssets = { project_id: 'p1', episode_id: null, is_for_all: true, for_entity: 'asset' }
  const episodeOne = { project_id: 'p1', episode_id: 'ep-1', is_for_all: false, for_entity: 'shot' }
  const context = (playlists, episodeId, allForEntity) => ({
    playlists,
    currentProduction: production,
    isTVShow: true,
    currentEpisode: episodeId ? { id: episodeId } : null,
    allForEntity
  })

  it('reloads on mount when the stored list belongs to another all-mode entity type', () => {
    // Coming back to All assets after a visit of the All shots playlists.
    expect(isStale.call(context([allShots], 'all', 'asset'))).toBe(true)
    expect(isStale.call(context([allAssets], 'all', 'asset'))).toBe(false)
    expect(isStale.call(context([allShots], 'all', 'shot'))).toBe(false)
  })

  it('reloads when the stored list belongs to another episode, production or pack', () => {
    expect(isStale.call(context([episodeOne], 'ep-2', undefined))).toBe(true)
    expect(isStale.call(context([episodeOne], 'ep-1', undefined))).toBe(false)
    expect(isStale.call(context([allAssets], 'ep-1', undefined))).toBe(true)
    expect(isStale.call(context([allAssets], 'main', undefined))).toBe(true)
    expect(isStale.call(context([episodeOne], 'all', 'shot'))).toBe(true)
    expect(
      isStale.call({ ...context([episodeOne], 'ep-1'), currentProduction: { id: 'p2' } })
    ).toBe(true)
    expect(isStale.call(context([], 'ep-1', undefined))).toBe(false)
  })
})

describe('Playlist page, loadEditsData', () => {
  const buildContext = (overrides = {}) => ({
    currentProduction: { id: 'p1' },
    currentEpisode: { id: 'ep-a' },
    isTVShow: true,
    displayedEdits: [{ id: 'e1', project_id: 'p1', episode_id: 'ep-a' }],
    editsLoadingKey: 'p1/ep-a',
    isEditsLoading: false,
    loadEdits: vi.fn(() => Promise.resolve()),
    loadEpisodes: vi.fn(() => Promise.resolve()),
    ...overrides
  })

  it('reloads the edits when the store holds another episode', async () => {
    const context = buildContext({ currentEpisode: { id: 'ep-b' } })

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).toHaveBeenCalled()
  })

  it('reloads the edits when the store holds the production-wide dataset', async () => {
    const context = buildContext({ editsLoadingKey: 'p1/all' })

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).toHaveBeenCalled()
  })

  it('keeps the edits loaded for the displayed episode', async () => {
    const context = buildContext()

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).not.toHaveBeenCalled()
  })

  // LOAD_EDITS_START records the key and empties the map: a load in flight
  // for the displayed scope must still be awaited.
  it('awaits a load in flight for the displayed episode', async () => {
    const context = buildContext({ isEditsLoading: true, displayedEdits: [] })

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).toHaveBeenCalled()
  })

  it('keeps an episode loaded without any edit', async () => {
    const context = buildContext({ displayedEdits: [] })

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).not.toHaveBeenCalled()
  })

  it('keeps the edits of a production without episodes', async () => {
    const context = buildContext({
      isTVShow: false,
      currentEpisode: null,
      editsLoadingKey: 'p1/'
    })

    await Playlist.methods.loadEditsData.call(context)

    expect(context.loadEdits).not.toHaveBeenCalled()
  })
})

describe('Playlist page, reloadAll', () => {
  const buildContext = (overrides = {}) => {
    const context = {
      loading: { playlists: false, playlistsInit: true },
      isReloadPending: false,
      servedScope: null,
      isServedScopeStale: false,
      isUnmounted: false,
      isPlaylistListStale: false,
      isTVShow: false,
      currentProduction: { id: 'p1' },
      currentEpisode: { id: 'ep-a' },
      allForEntity: undefined,
      currentSort: 'updated_at',
      taskTypeId: '',
      page: 0,
      loadEpisodes: vi.fn(() => Promise.resolve()),
      loadShotsData: vi.fn(() => Promise.resolve()),
      loadAssetsData: vi.fn(() => Promise.resolve()),
      loadEditsData: vi.fn(() => Promise.resolve()),
      loadEpisodesData: vi.fn(() => Promise.resolve()),
      loadPlaylistsData: vi.fn(() => Promise.resolve()),
      resetPlaylist: vi.fn(),
      ...overrides
    }
    context.reloadScope = () => Playlist.methods.reloadScope.call(context)
    context.runReload = work => Playlist.methods.runReload.call(context, work)
    context.reloadAll = force =>
      Playlist.methods.reloadAll.call(context, force)
    context.reloadPlaylistList = () =>
      Playlist.methods.reloadPlaylistList.call(context)
    return context
  }

  // Only the first call is held back: the queued run must complete.
  const gateFirstCall = () => {
    let release
    const fn = vi
      .fn(() => Promise.resolve())
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            release = resolve
          })
      )
    return { fn, release: () => release() }
  }

  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  // The currentEpisode watcher calls reloadAll while a previous run is still
  // fetching: that call used to be dropped, leaving the page on the episode
  // the running load was started for.
  it('runs again once when the scope moved during a load', async () => {
    const shots = gateFirstCall()
    const context = buildContext({ loadShotsData: shots.fn })

    const first = context.reloadAll()
    context.currentEpisode = { id: 'ep-b' }
    context.reloadAll()
    context.reloadAll()
    shots.release()
    await first

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(2)
    expect(context.loading.playlists).toBe(false)
  })

  // A request the running load already serves must not cost a second run.
  it('does not replay a request the run already served', async () => {
    const shots = gateFirstCall()
    const context = buildContext({ loadShotsData: shots.fn })

    const first = context.reloadAll()
    context.reloadAll()
    shots.release()
    await first

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(1)
    expect(context.isReloadPending).toBe(false)
  })

  // On a TV show the run resolves the episode itself, which fires the
  // currentEpisode watcher: that request is served by the same run.
  it('does not replay the episode its own load resolved', async () => {
    const context = buildContext({ isTVShow: true, currentEpisode: null })
    context.loadEpisodes = vi.fn(() => {
      context.currentEpisode = { id: 'ep-a' }
      context.reloadAll()
      return Promise.resolve()
    })

    await context.reloadAll()

    expect(context.loadEpisodes).toHaveBeenCalledTimes(1)
    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(1)
  })

  // Two switches inside one run: the run ends on the scope it started with,
  // but the loads made in between may have served the other one, and the
  // run cannot tell which. Replay.
  it('runs again when the scope moved and came back during a load', async () => {
    const shots = gateFirstCall()
    const context = buildContext({ loadShotsData: shots.fn })

    const first = context.reloadAll()
    context.currentEpisode = { id: 'ep-b' }
    context.reloadAll()
    context.currentEpisode = { id: 'ep-a' }
    context.reloadAll()
    shots.release()
    await first

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(2)
    expect(context.isServedScopeStale).toBe(false)
  })

  // A run in flight when the page unmounts must not load further: the next
  // load would blank the page displayed instead.
  it('stops the run once the page is unmounted', async () => {
    const context = buildContext()
    context.loadShotsData = vi.fn(() => {
      context.isUnmounted = true
      return Promise.resolve()
    })

    await context.reloadAll()

    expect(context.loadAssetsData).not.toHaveBeenCalled()
    expect(context.loadPlaylistsData).not.toHaveBeenCalled()
    expect(context.loading.playlists).toBe(false)
  })

  it('runs once when nothing interrupts it', async () => {
    const context = buildContext()

    await context.reloadAll()

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(1)
  })

  it('skips the queued run once the page is unmounted', async () => {
    const playlists = gateFirstCall()
    const context = buildContext({ loadPlaylistsData: playlists.fn })

    const first = context.reloadAll()
    context.currentEpisode = { id: 'ep-b' }
    context.reloadAll()
    // Let the run reach the gated playlists load before leaving the page.
    await flush()
    context.isUnmounted = true
    playlists.release()
    await first

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(1)
    expect(context.isReloadPending).toBe(false)
  })

  // The sort watcher reloads the playlists on its own: a request received
  // during that run must be served too, or it stays pending forever.
  it('serves an episode change requested during a sort reload', async () => {
    const playlists = gateFirstCall()
    const context = buildContext({ loadPlaylistsData: playlists.fn })

    context.currentSort = 'name'
    Playlist.watch.currentSort.call(context)
    context.currentEpisode = { id: 'ep-b' }
    context.reloadAll()
    playlists.release()
    await flush()

    expect(context.loadShotsData).toHaveBeenCalledTimes(1)
    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(2)
    expect(context.loading.playlists).toBe(false)
  })

  it('serves the queued reload even when the run fails', async () => {
    const context = buildContext({
      loadPlaylistsData: vi
        .fn(() => Promise.resolve())
        .mockImplementationOnce(() => Promise.reject(new Error('down')))
    })

    const first = context.reloadAll()
    context.reloadAll()
    await expect(first).rejects.toThrow('down')

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(2)
    expect(context.isReloadPending).toBe(false)
    expect(context.loading.playlists).toBe(false)
  })

  // A sort change queued behind a run must still fetch: the replay cannot
  // rely on the list looking stale.
  it('fetches the playlists again when a sort change was queued', async () => {
    const shots = gateFirstCall()
    const context = buildContext({ loadShotsData: shots.fn })

    const first = context.reloadAll()
    context.currentSort = 'name'
    Playlist.watch.currentSort.call(context)
    shots.release()
    await first

    expect(context.loadPlaylistsData).toHaveBeenCalledTimes(2)
    expect(context.loadPlaylistsData).toHaveBeenLastCalledWith(true)
  })

  it('reloads the list through the gate when the task type filter changes', async () => {
    const context = buildContext()

    Playlist.watch.taskTypeId.call(context)
    await flush()

    expect(context.loadPlaylistsData).toHaveBeenCalledWith(true)
    expect(context.loading.playlists).toBe(false)
  })

  it('releases the lock when the run fails', async () => {
    const context = buildContext({
      loadPlaylistsData: vi.fn(() => Promise.reject(new Error('down')))
    })

    await expect(context.reloadAll()).rejects.toThrow('down')

    expect(context.loading.playlists).toBe(false)
  })
})

describe('Playlist page, loadShotsData', () => {
  const buildContext = (overrides = {}) => ({
    currentProduction: { id: 'p1' },
    currentEpisode: { id: 'ep-a' },
    isTVShow: true,
    displayedShots: [{ id: 's1', project_id: 'p1', episode_id: 'ep-a' }],
    shotsLoadingKey: 'p1/ep-a',
    isShotsLoading: false,
    loadShots: vi.fn(() => Promise.resolve()),
    loadEpisodes: vi.fn(() => Promise.resolve()),
    ...overrides
  })

  // The first row says nothing about the loaded scope: a production-wide
  // dataset whose first shot belongs to the displayed episode passed the
  // check and the add panel listed the shots of every episode.
  it('reloads the shots when the store holds the production-wide dataset', async () => {
    const context = buildContext({ shotsLoadingKey: 'p1/all' })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).toHaveBeenCalled()
  })

  it('reloads the shots when the store holds another episode', async () => {
    const context = buildContext({ currentEpisode: { id: 'ep-b' } })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).toHaveBeenCalled()
  })

  it('keeps the shots loaded for the displayed episode', async () => {
    const context = buildContext()

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).not.toHaveBeenCalled()
  })

  // LOAD_SHOTS_START records the key and empties the map: a load in flight
  // for the displayed scope must still be awaited, or the playlist is rebuilt
  // against an empty map and loses its shots.
  it('awaits a load in flight for the displayed episode', async () => {
    const context = buildContext({ isShotsLoading: true, displayedShots: [] })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).toHaveBeenCalled()
  })

  it('keeps an episode loaded without any shot', async () => {
    const context = buildContext({ displayedShots: [] })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).not.toHaveBeenCalled()
  })

  it('loads nothing for the pseudo-episodes', async () => {
    const context = buildContext({
      currentEpisode: { id: 'all' },
      shotsLoadingKey: 'p1/ep-a'
    })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).not.toHaveBeenCalled()
  })

  it('keeps the shots of a production without episodes', async () => {
    const context = buildContext({
      isTVShow: false,
      currentEpisode: null,
      shotsLoadingKey: 'p1/'
    })

    await Playlist.methods.loadShotsData.call(context)

    expect(context.loadShots).not.toHaveBeenCalled()
  })
})
