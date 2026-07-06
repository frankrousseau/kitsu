import { unref, watch, onBeforeUnmount } from 'vue'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])'

export const useModal = (active, emit, containerRef = null) => {
  // Where keyboard focus was before the modal opened, restored on close.
  let previouslyFocused = null

  const trapFocus = event => {
    const container = unref(containerRef)
    if (!container) return
    const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const onKeyDown = event => {
    if (event.key === 'Escape') {
      emit('cancel')
    } else if (event.key === 'Tab') {
      trapFocus(event)
    }
  }

  watch(
    active,
    isActive => {
      if (isActive) {
        previouslyFocused = document.activeElement
        window.addEventListener('keydown', onKeyDown, false)
      } else {
        window.removeEventListener('keydown', onKeyDown)
        if (previouslyFocused?.focus) previouslyFocused.focus()
        previouslyFocused = null
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
