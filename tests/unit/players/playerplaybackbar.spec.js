import { mount } from '@vue/test-utils'

import PlayerPlaybackBar from '@/components/players/bars/PlayerPlaybackBar.vue'

const mountBar = (props = {}) =>
  mount(PlayerPlaybackBar, {
    props: {
      currentFrameLabel: '005',
      isMovie: true,
      nbFrames: 120,
      ...props
    },
    global: {
      mocks: { $t: key => key },
      stubs: {
        ButtonSimple: true,
        ButtonSound: true,
        ComboboxStyled: true,
        SpeedButton: true
      }
    }
  })

describe('players/PlayerPlaybackBar', () => {
  describe('frame indicator', () => {
    it('keeps the 1-based numbering without a frame start', () => {
      const wrapper = mountBar()
      expect(wrapper.text()).toContain('(005 / 120)')
    })

    it('offsets the numbering so the first frame reads as frameStart', () => {
      const wrapper = mountBar({ frameStart: 1001 })
      expect(wrapper.text()).toContain('(1005 / 1120)')
    })

    it('ignores a frame start of zero or less', () => {
      expect(mountBar({ frameStart: 0 }).text()).toContain('(005 / 120)')
      expect(mountBar({ frameStart: -10 }).text()).toContain('(005 / 120)')
    })

    it('offsets the compact light indicator too', () => {
      const wrapper = mountBar({ frameStart: 1001, light: true })
      expect(wrapper.text()).toContain('(1005)')
      expect(wrapper.text()).not.toContain('1120')
    })
  })
})
