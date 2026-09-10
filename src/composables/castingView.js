import { ref, watch } from 'vue'

const STORAGE_KEY = 'casting-view'

// Cards or list, shared by every entity casting tab and kept across reloads.
export const useCastingView = () => {
  const castingView = ref(localStorage.getItem(STORAGE_KEY) || 'cards')
  watch(castingView, view => localStorage.setItem(STORAGE_KEY, view))
  return castingView
}
