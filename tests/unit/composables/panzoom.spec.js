import { usePanzoomSync } from '@/composables/panzoom'

describe('composables/panzoom', () => {
  describe('initial state', () => {
    it('starts with identity transform', () => {
      const { transform } = usePanzoomSync()
      expect(transform.value).toEqual({ x: 0, y: 0, scale: 1 })
    })
  })

  describe('onPanzoomChanged', () => {
    it('updates the transform ref', () => {
      const { transform, onPanzoomChanged } = usePanzoomSync()
      onPanzoomChanged({ x: 10, y: 20, scale: 2 })
      expect(transform.value).toEqual({ x: 10, y: 20, scale: 2 })
    })

    it('replaces the previous transform on each call', () => {
      const { transform, onPanzoomChanged } = usePanzoomSync()
      onPanzoomChanged({ x: 5, y: 5, scale: 1.5 })
      onPanzoomChanged({ x: -3, y: 7, scale: 0.8 })
      expect(transform.value).toEqual({ x: -3, y: 7, scale: 0.8 })
    })
  })

  describe('reset', () => {
    it('restores the identity transform', () => {
      const { transform, onPanzoomChanged, reset } = usePanzoomSync()
      onPanzoomChanged({ x: 42, y: -17, scale: 3 })
      reset()
      expect(transform.value).toEqual({ x: 0, y: 0, scale: 1 })
    })
  })

  describe('applyTo', () => {
    it('is a no-op when target is null', () => {
      const { applyTo } = usePanzoomSync()
      expect(() => applyTo(null)).not.toThrow()
    })

    it('is a no-op when target is undefined', () => {
      const { applyTo } = usePanzoomSync()
      expect(() => applyTo(undefined)).not.toThrow()
    })

    it('applies the current transform to a fabric-like canvas', () => {
      const { onPanzoomChanged, applyTo } = usePanzoomSync()
      const fakeCanvas = {
        setViewportTransform: vi.fn(),
        requestRenderAll: vi.fn()
      }
      onPanzoomChanged({ x: 12, y: 34, scale: 2.5 })
      applyTo(fakeCanvas)
      expect(fakeCanvas.setViewportTransform).toHaveBeenCalledWith([
        2.5, 0, 0, 2.5, 12, 34
      ])
      expect(fakeCanvas.requestRenderAll).toHaveBeenCalledOnce()
    })

    it('applies the identity transform when state is fresh', () => {
      const { applyTo } = usePanzoomSync()
      const fakeCanvas = {
        setViewportTransform: vi.fn(),
        requestRenderAll: vi.fn()
      }
      applyTo(fakeCanvas)
      expect(fakeCanvas.setViewportTransform).toHaveBeenCalledWith([
        1, 0, 0, 1, 0, 0
      ])
    })
  })
})
