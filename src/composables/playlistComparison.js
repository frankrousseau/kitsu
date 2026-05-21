/*
 * Composable for the PlaylistPlayer's comparison mode.
 *
 * Owns the playlist-specific comparison state (revision selection
 * per-entity, entity-list-to-compare, comparison-entity-missing flag,
 * picture-index inside the compared revision) and reuses the generic
 * primitives from useComparison (mode options, overlay math, the
 * shared `isComparing` / `taskTypeId` / `comparisonMode` refs and the
 * toggle-full-overlay helper).
 */
import { computed, ref } from 'vue'

import { useComparison } from '@/composables/comparison'

export const usePlaylistComparison = ({
  currentEntity,
  entityList,
  taskTypeMap,
  t
}) => {
  // Shared base — feed useComparison the current entity's preview files
  // so its taskTypeOptions logic (which we don't use) sees something
  // coherent, and so its comparisonModeOptions/overlay computeds stay
  // accurate.
  const entityPreviewFiles = computed(
    () => currentEntity.value?.preview_files || {}
  )
  const currentPreview = ref(null) // unused by playlist mode, satisfies useComparison shape
  const base = useComparison({
    entityPreviewFiles,
    currentPreview,
    taskTypeMap,
    t
  })

  // Playlist-specific state
  const revisionToCompare = ref(null)
  const comparisonEntityMissing = ref(false)
  const currentComparisonPreviewIndex = ref(0)
  const savedTaskTypeToCompare = ref(null)

  // Playlist-specific computeds (placeholders, filled in subsequent tasks)
  const taskTypeOptions = computed(() => {
    const entity = currentEntity.value
    if (!entity?.preview_files) return []
    const map = taskTypeMap.value
    return Object.keys(entity.preview_files)
      .filter(id => entity.preview_files[id] && map.get(id))
      .map(id => ({ label: map.get(id).name, value: id }))
      .sort(
        (a, b) => -a.label.localeCompare(b.label, undefined, { numeric: true })
      )
  })
  const revisionOptions = computed(() => {
    const entity = currentEntity.value
    const files = entity?.preview_files?.[base.taskTypeId.value]
    if (!files) return []
    const revisions = files.map(p => p.revision).sort((a, b) => b - a)
    return [
      { label: 'Last', value: null },
      ...revisions.map(r => ({ label: `v${r}`, value: `${r}` }))
    ]
  })
  const entityListToCompare = computed(() => {
    if (!base.taskTypeId.value) return []
    return entityList.value.map(entity => {
      const previewFiles = entity?.preview_files
      if (!previewFiles || Object.keys(previewFiles).length === 0) {
        return { preview_file_id: '', preview_file_extension: 'none' }
      }
      let key = base.taskTypeId.value
      let files = previewFiles[key]
      if (!files) {
        key = Object.keys(previewFiles)[0]
        files = previewFiles[key]
      }
      if (!files) return null
      let preview = files.find(p => `${p.revision}` === revisionToCompare.value)
      if (!preview) preview = files[0]
      return {
        preview_file_id: preview.id,
        preview_file_extension: preview.extension
      }
    })
  })

  return {
    // Shared from useComparison
    isComparing: base.isComparing,
    taskTypeId: base.taskTypeId,
    comparisonMode: base.comparisonMode,
    comparisonModeOptions: base.comparisonModeOptions,
    isComparisonOverlay: base.isComparisonOverlay,
    overlayOpacity: base.overlayOpacity,
    toggleFullOverlay: base.toggleFullOverlay,

    // Playlist-specific state
    revisionToCompare,
    entityListToCompare,
    comparisonEntityMissing,
    currentComparisonPreviewIndex,
    savedTaskTypeToCompare,

    // Playlist-specific computeds (filled in next tasks)
    taskTypeOptions,
    revisionOptions
  }
}
