import { computed } from 'vue'
import { useStore } from 'vuex'

// Palette and font shared by the chart.js charts. The canvas cannot resolve
// var(--*) tokens, so the theme values are pinned here.
export const useChartTheme = () => {
  const store = useStore()
  const isDarkTheme = computed(() => store.getters.isDarkTheme)
  const theme = computed(() =>
    isDarkTheme.value
      ? {
          fillTop: 'rgba(0, 178, 66, 0.28)',
          fillBottom: 'rgba(0, 178, 66, 0.03)',
          futureFill: 'rgba(255, 255, 255, 0.04)',
          grid: 'rgba(255, 255, 255, 0.08)',
          muted: '#9a9da8'
        }
      : {
          fillTop: 'rgba(0, 178, 66, 0.22)',
          fillBottom: 'rgba(0, 178, 66, 0.02)',
          futureFill: 'rgba(0, 0, 0, 0.03)',
          grid: 'rgba(0, 0, 0, 0.06)',
          muted: '#7b7e87'
        }
  )
  const font = { family: 'Lato, sans-serif' }
  return { font, theme }
}
