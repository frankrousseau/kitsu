/*
 * Transport state shared by the players (PreviewPlayer, PlaylistPlayer,
 * SharedPlaylistPlayer). Owns only the refs whose defaults are identical
 * across players; side effects (preference persistence, decoder calls,
 * room sync) stay in each player.
 */
import { ref } from 'vue'

export const usePlayerTransport = () => {
  const currentTimeRaw = ref(0)
  const isHd = ref(false)
  const isMuted = ref(false)
  const isPlaying = ref(false)
  const isRepeating = ref(false)
  const speed = ref(3)
  const volume = ref(50)

  return {
    currentTimeRaw,
    isHd,
    isMuted,
    isPlaying,
    isRepeating,
    speed,
    volume
  }
}
