import { mount } from '@vue/test-utils'

import PlayerComparisonBar from '@/components/players/bars/PlayerComparisonBar.vue'

const mountBar = (props = {}) =>
  mount(PlayerComparisonBar, {
    props: {
      isComparing: true,
      isComparisonEnabled: true,
      taskTypeOptions: [{ label: 'Animation', value: 'tt-anim' }],
      ...props
    },
    global: {
      mocks: { $t: key => key },
      stubs: { Combobox: true }
    }
  })

describe('players/PlayerComparisonBar', () => {
  describe('comparison picture picker', () => {
    it('is hidden when the compared revision has a single picture', () => {
      const wrapper = mountBar({ comparisonPreviewLength: 1 })
      expect(wrapper.find('.comparison-list').exists()).toBe(false)
    })

    it('is hidden when the compared revision picture count is unknown', () => {
      const wrapper = mountBar({ comparisonPreviewLength: 0 })
      expect(wrapper.find('.comparison-list').exists()).toBe(false)
    })

    it('is hidden when not comparing', () => {
      const wrapper = mountBar({
        isComparing: false,
        comparisonPreviewLength: 3
      })
      expect(wrapper.find('.comparison-list').exists()).toBe(false)
    })

    it('shows the position when the compared revision has several pictures', () => {
      const wrapper = mountBar({
        comparisonPreviewIndex: 1,
        comparisonPreviewLength: 3
      })
      const index = wrapper.find('.comparison-index')
      expect(index.exists()).toBe(true)
      expect(index.text().replace(/\s+/g, ' ')).toBe('2 / 3')
    })

    it('emits previous/next comparison events on arrow clicks', async () => {
      const wrapper = mountBar({ comparisonPreviewLength: 3 })
      const buttons = wrapper.findAll('.comparison-list button')
      expect(buttons).toHaveLength(2)
      await buttons[0].trigger('click')
      await buttons[1].trigger('click')
      expect(wrapper.emitted('previous-comparison-clicked')).toHaveLength(1)
      expect(wrapper.emitted('next-comparison-clicked')).toHaveLength(1)
    })
  })
})
