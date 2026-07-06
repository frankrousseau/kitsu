vi.mock('@/store', () => ({ default: {} }))

import AssetList from '@/components/lists/AssetList.vue'

const isSelectable = AssetList.methods.isSelectable

const modelingId = 'task-type-modeling'
const riggingId = 'task-type-rigging'
const assetTypeId = 'asset-type-props'

const buildContext = () => ({
  assetTypeMap: new Map([
    [assetTypeId, { id: assetTypeId, task_types: [riggingId] }]
  ]),
  taskTypeMap: new Map([
    [modelingId, { id: modelingId }],
    [riggingId, { id: riggingId }]
  ]),
  taskMap: new Map([['task-1', { id: 'task-1' }]]),
  productionAssetTaskTypes: [{ id: modelingId }, { id: riggingId }]
})

const buildAsset = validations => ({
  id: 'asset-1',
  asset_type_id: assetTypeId,
  validations
})

describe('lists/AssetList', () => {
  describe('isSelectable', () => {
    test('cell with an existing task stays selectable when its task type left the workflow', () => {
      const asset = buildAsset(new Map([[modelingId, 'task-1']]))
      expect(isSelectable.call(buildContext(), asset, modelingId)).toBe(true)
    })

    test('empty cell outside the workflow is not selectable', () => {
      const asset = buildAsset(new Map())
      expect(isSelectable.call(buildContext(), asset, modelingId)).toBe(false)
    })

    test('empty cell inside the workflow is selectable', () => {
      const asset = buildAsset(new Map())
      expect(isSelectable.call(buildContext(), asset, riggingId)).toBe(true)
    })

    test('empty workflow allows every production task type', () => {
      const context = buildContext()
      context.assetTypeMap.get(assetTypeId).task_types = []
      const asset = buildAsset(new Map())
      expect(isSelectable.call(context, asset, modelingId)).toBe(true)
    })

    test('shared asset cells are never selectable', () => {
      const asset = {
        ...buildAsset(new Map([[modelingId, 'task-1']])),
        shared: true
      }
      expect(isSelectable.call(buildContext(), asset, modelingId)).toBe(false)
    })

    test('stale validation entry pointing to a deleted task does not force selectability', () => {
      const asset = buildAsset(new Map([[modelingId, 'task-gone']]))
      expect(isSelectable.call(buildContext(), asset, modelingId)).toBe(false)
    })
  })
})
