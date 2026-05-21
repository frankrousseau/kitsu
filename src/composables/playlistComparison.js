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
  const entityListToCompare = ref([])
  const comparisonEntityMissing = ref(false)
  const currentComparisonPreviewIndex = ref(0)
  const savedTaskTypeToCompare = ref(null)

  // Playlist-specific computeds (placeholders, filled in subsequent tasks)
  const taskTypeOptions = ref([])
  const revisionOptions = ref([])

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
