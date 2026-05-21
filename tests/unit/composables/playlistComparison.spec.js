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

  describe('taskTypeOptions', () => {
    it('lists task types from currentEntity.preview_files sorted by name desc', () => {
      const ttMap = new Map([
        ['tt-anim', { id: 'tt-anim', name: 'Animation' }],
        ['tt-lay', { id: 'tt-lay', name: 'Layout' }],
        ['tt-comp', { id: 'tt-comp', name: 'Compositing' }]
      ])
      const entity = {
        preview_files: {
          'tt-anim': [{ id: 'p1', revision: 1, extension: 'mp4' }],
          'tt-lay': [{ id: 'p2', revision: 1, extension: 'mp4' }],
          'tt-comp': [{ id: 'p3', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({ entityList: [entity], taskTypeMap: ttMap })
      )
      expect(c.taskTypeOptions.value).toEqual([
        { label: 'Layout', value: 'tt-lay' },
        { label: 'Compositing', value: 'tt-comp' },
        { label: 'Animation', value: 'tt-anim' }
      ])
    })

    it('returns [] when currentEntity is null', () => {
      const c = usePlaylistComparison(makeInputs())
      expect(c.taskTypeOptions.value).toEqual([])
    })

    it('skips task types absent from taskTypeMap', () => {
      const entity = {
        preview_files: {
          'tt-known': [{ id: 'p1', revision: 1, extension: 'mp4' }],
          'tt-unknown': [{ id: 'p2', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-known', { id: 'tt-known', name: 'Anim' }]])
        })
      )
      expect(c.taskTypeOptions.value).toEqual([
        { label: 'Anim', value: 'tt-known' }
      ])
    })
  })
})
