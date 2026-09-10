import { vi } from 'vitest'

// Importing the page transitively pulls in the root store
// (lib/models → timezone → @/store); stub it so no Vuex store is built.
vi.mock('@/store', () => ({ default: {} }))

import Concepts from '@/components/pages/Concepts.vue'

describe('Concepts page, refreshConcepts', () => {
  // The concepts route carries no episode: moving the store to the all
  // pseudo-episode leaked into the topbar and the next section link.
  test('loads every asset without moving the current episode', async () => {
    const context = {
      isTVShow: true,
      loading: { loadingConcepts: false },
      errors: { loadingConcepts: false },
      loadAssets: vi.fn(() => Promise.resolve()),
      loadConcepts: vi.fn(() => Promise.resolve()),
      setCurrentEpisode: vi.fn()
    }

    await Concepts.methods.refreshConcepts.call(context)

    expect(context.loadAssets).toHaveBeenCalledWith({ all: true })
    expect(context.setCurrentEpisode).not.toHaveBeenCalled()
    expect(context.loading.loadingConcepts).toBe(false)
  })
})
