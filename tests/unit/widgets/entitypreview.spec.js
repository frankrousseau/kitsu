import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

import EntityPreview from '@/components/widgets/EntityPreview.vue'

const entity = {
  id: 'asset-1',
  preview_file_id: 'preview-1',
  preview_file_extension: 'png'
}

const mountPreview = props => {
  const commit = vi.fn()
  const store = createStore({})
  store.commit = commit
  const wrapper = shallowMount(EntityPreview, {
    props: { entity, ...props },
    global: { plugins: [store] }
  })
  return { wrapper, commit }
}

describe('EntityPreview', () => {
  test('opens the preview when clicking the view icon', async () => {
    const { wrapper, commit } = mountPreview()
    await wrapper.find('.view-icon').trigger('click')
    expect(commit).toHaveBeenCalledWith('SHOW_PREVIEW_FILE', 'preview-1')
  })

  test('hides the view icon when previewing is disabled', () => {
    const { wrapper } = mountPreview({ noPreview: true })
    expect(wrapper.find('.view-icon').exists()).toBe(false)
  })
})
