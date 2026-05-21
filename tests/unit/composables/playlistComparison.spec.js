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

  describe('revisionOptions', () => {
    it('lists revisions for the selected task type, descending, with Last prepended', () => {
      const entity = {
        preview_files: {
          'tt-anim': [
            { id: 'p1', revision: 1, extension: 'mp4' },
            { id: 'p3', revision: 3, extension: 'mp4' },
            { id: 'p2', revision: 2, extension: 'mp4' }
          ]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.taskTypeId.value = 'tt-anim'
      expect(c.revisionOptions.value).toEqual([
        { label: 'Last', value: null },
        { label: 'v3', value: '3' },
        { label: 'v2', value: '2' },
        { label: 'v1', value: '1' }
      ])
    })

    it('returns [] when the selected task type has no preview files for the current entity', () => {
      const entity = { preview_files: {} }
      const c = usePlaylistComparison(
        makeInputs({ entityList: [entity], taskTypeMap: new Map() })
      )
      c.taskTypeId.value = 'tt-missing'
      expect(c.revisionOptions.value).toEqual([])
    })
  })

  describe('entityListToCompare', () => {
    it('maps each playlist entity to its matching preview for the selected revision', () => {
      const entityA = {
        preview_files: {
          'tt-anim': [
            { id: 'a1', revision: 1, extension: 'mp4' },
            { id: 'a2', revision: 2, extension: 'mp4' }
          ]
        }
      }
      const entityB = {
        preview_files: {
          'tt-anim': [{ id: 'b1', revision: 1, extension: 'png' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entityA, entityB],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.taskTypeId.value = 'tt-anim'
      c.revisionToCompare.value = '2'
      expect(c.entityListToCompare.value).toEqual([
        { preview_file_id: 'a2', preview_file_extension: 'mp4' },
        // entity B has no revision 2 → fall back to its first preview
        { preview_file_id: 'b1', preview_file_extension: 'png' }
      ])
    })

    it('returns a "none" placeholder for entities without any preview files', () => {
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [{ preview_files: {} }],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.taskTypeId.value = 'tt-anim'
      expect(c.entityListToCompare.value).toEqual([
        { preview_file_id: '', preview_file_extension: 'none' }
      ])
    })

    it('falls back to the first task-type when the selected one is missing on that entity', () => {
      const entity = {
        preview_files: {
          'tt-other': [{ id: 'o1', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.taskTypeId.value = 'tt-anim'
      expect(c.entityListToCompare.value).toEqual([
        { preview_file_id: 'o1', preview_file_extension: 'mp4' }
      ])
    })

    it('returns [] when no task type is selected', () => {
      const c = usePlaylistComparison(makeInputs({ entityList: [{}, {}] }))
      expect(c.entityListToCompare.value).toEqual([])
    })

    it('returns the "none" placeholder when the fallback task-type has an empty array', () => {
      const entity = {
        preview_files: {
          'tt-other': []
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.taskTypeId.value = 'tt-anim'
      expect(c.entityListToCompare.value).toEqual([
        { preview_file_id: '', preview_file_extension: 'none' }
      ])
    })
  })

  describe('comparisonEntityMissing', () => {
    it('is true when the saved task-type is not available on the current entity', () => {
      const entity = {
        preview_files: {
          'tt-anim': [{ id: 'p1', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.savedTaskTypeToCompare.value = 'tt-comp' // not available
      expect(c.comparisonEntityMissing.value).toBe(true)
    })

    it('is false when the saved task-type is available', () => {
      const entity = {
        preview_files: {
          'tt-anim': [{ id: 'p1', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      c.savedTaskTypeToCompare.value = 'tt-anim'
      expect(c.comparisonEntityMissing.value).toBe(false)
    })

    it('is false when no saved task-type has been set yet', () => {
      const entity = {
        preview_files: {
          'tt-anim': [{ id: 'p1', revision: 1, extension: 'mp4' }]
        }
      }
      const c = usePlaylistComparison(
        makeInputs({
          entityList: [entity],
          taskTypeMap: new Map([['tt-anim', { id: 'tt-anim', name: 'Anim' }]])
        })
      )
      expect(c.comparisonEntityMissing.value).toBe(false)
    })
  })
})
