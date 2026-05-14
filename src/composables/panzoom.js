import { ref } from 'vue'

export function usePanzoomSync() {
  const transform = ref({ x: 0, y: 0, scale: 1 })

  const onPanzoomChanged = ({ x, y, scale }) => {
    transform.value = { x, y, scale }
  }

  const reset = () => {
    transform.value = { x: 0, y: 0, scale: 1 }
  }

  const applyTo = fabricCanvas => {
    if (!fabricCanvas) return
    const { x, y, scale } = transform.value
    fabricCanvas.setViewportTransform([scale, 0, 0, scale, x, y])
    fabricCanvas.requestRenderAll()
  }

  return { transform, onPanzoomChanged, reset, applyTo }
}
