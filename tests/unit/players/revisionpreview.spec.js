import { mount } from '@vue/test-utils'

import RevisionPreview from '@/components/players/headers/RevisionPreview.vue'

const previewFile = {
  id: 'p1',
  extension: 'png',
  original_name: 'camera_A',
  validation_status: 'validated'
}

const mountPreview = (props = {}) =>
  mount(RevisionPreview, {
    props: { index: 0, previewFile, ...props },
    global: { stubs: { LightEntityThumbnail: true } }
  })

describe('players/RevisionPreview', () => {
  it('shows the file name and its validation status', () => {
    const wrapper = mountPreview()
    expect(wrapper.find('.preview-name').text()).toBe('camera_A')
    expect(wrapper.find('.preview-status').attributes('data-status')).toBe(
      'validated'
    )
  })

  it('toggles only for validators, without selecting the preview', async () => {
    const readOnly = mountPreview()
    await readOnly.find('.preview-status').trigger('click')
    expect(readOnly.emitted('validation-status-clicked')).toBeUndefined()

    const manager = mountPreview({ canValidate: true })
    await manager.find('.preview-status').trigger('click')
    expect(manager.emitted('validation-status-clicked')).toHaveLength(1)
    expect(manager.emitted('selected')).toBeUndefined()
  })
})
