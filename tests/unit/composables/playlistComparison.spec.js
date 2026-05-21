import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import { usePlaylistComparison } from '@/composables/playlistComparison'

const makeInputs = ({
  entityList = [],
  playingEntityIndex = 0,
  taskTypeMap = new Map()
} = {}) => {
  const entityListRef = ref(entityList)
  const playingEntityIndexRef = ref(playingEntityIndex)
  const currentEntity = computed(
    () => entityListRef.value[playingEntityIndexRef.value] || null
  )
  return {
    entityList: entityListRef,
    playingEntityIndex: playingEntityIndexRef,
    currentEntity,
    taskTypeMap: ref(taskTypeMap),
    t: key => key
  }
}

describe('composables/playlistComparison', () => {
  describe('initial state', () => {
    it('starts not comparing, with empty option lists', () => {
      const c = usePlaylistComparison(makeInputs())
      expect(c.isComparing.value).toBe(false)
      expect(c.taskTypeOptions.value).toEqual([])
      expect(c.revisionOptions.value).toEqual([])
      expect(c.entityListToCompare.value).toEqual([])
      expect(c.comparisonEntityMissing.value).toBe(false)
      expect(c.revisionToCompare.value).toBe(null)
      expect(c.taskTypeId.value).toBe('')
      expect(c.comparisonMode.value).toBe('sidebyside')
    })
  })
})
