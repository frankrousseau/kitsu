import { computed } from 'vue'
import { useStore } from 'vuex'
import colors from '@/lib/colors'

export const useTaskStatusStyle = () => {
  const store = useStore()
  const isDarkTheme = computed(() => store.getters.isDarkTheme)

  const backgroundColor = taskStatus => {
    if ((!taskStatus || taskStatus.name === 'Todo') && !isDarkTheme.value) {
      return '#ECECEC'
    } else if (
      (!taskStatus || taskStatus.name === 'Todo') &&
      isDarkTheme.value
    ) {
      return '#5F626A'
    } else if (isDarkTheme.value) {
      return colors.darkenColor(taskStatus.color)
    } else {
      return taskStatus.color
    }
  }

  const color = taskStatus => {
    if (!taskStatus || taskStatus.name !== 'Todo' || isDarkTheme.value) {
      return 'white'
    } else {
      return '#333'
    }
  }

  // Chip washed with the status color, with the color itself exposed for
  // the rail drawn by the component: the concepts page representation.
  const tintedStyle = taskStatus => {
    const statusColor = taskStatus?.color || backgroundColor(taskStatus)
    return {
      background: `${statusColor}26`,
      color: 'var(--text-strong)',
      '--status-color': statusColor
    }
  }

  return { backgroundColor, color, isDarkTheme, tintedStyle }
}
