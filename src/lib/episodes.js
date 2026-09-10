// Whether an entity of `projectId` attached to `episodeId` belongs to the
// dataset a store loaded under `loadingKey` (`<production>/<scope>`): 'all'
// holds every entity of the production, 'main' the entities without episode,
// a real episode its own, an empty scope everything. No recorded scope
// (nothing loaded, or the last load failed) holds nothing. `projectId` is
// optional, the production of the entity being unknown to some callers.
export const isEpisodeInLoadedScope = (loadingKey, episodeId, projectId) => {
  if (!loadingKey) return false
  const [production, loadedScope] = loadingKey.split('/')
  if (projectId && production !== projectId) return false
  const scope = loadedScope ?? ''
  if (!scope || scope === 'all') return true
  if (scope === 'main') return !episodeId
  return episodeId === scope
}

// Whether a shot:new event is worth a fetch: nothing to insert into while no
// shots list is loaded, and the CSV importer emits no episode_id, then the
// store decides once the shot is fetched.
export const isNewShotInLoadedScope = (shotsLoadingKey, episodeId) =>
  Boolean(shotsLoadingKey) &&
  (!episodeId || isEpisodeInLoadedScope(shotsLoadingKey, episodeId))
