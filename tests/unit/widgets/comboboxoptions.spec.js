import { shallowMount } from '@vue/test-utils'

import ComboboxOptions from '@/components/widgets/ComboboxOptions.vue'

import './setup'

describe('ComboboxOptions', () => {
  const options = [
    { label: 'Show infos', value: 'showInfos' },
    { label: 'Big thumbnails', value: 'bigThumbnails' },
    { label: 'Show assignations', value: 'showAssignations' }
  ]

  let wrapper

  beforeEach(() => {
    wrapper = shallowMount(ComboboxOptions, {
      props: {
        title: 'Display options',
        options,
        modelValue: { showInfos: true }
      }
    })
  })

  it('mounts successfully', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('exposes combobox/listbox ARIA roles with multiselectable', async () => {
    const trigger = wrapper.find('.flexrow')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('tabindex')).toBe('0')
    await trigger.trigger('click')
    const list = wrapper.find('.select-input')
    expect(list.attributes('role')).toBe('listbox')
    expect(list.attributes('aria-multiselectable')).toBe('true')
  })

  it('marks the checked option as aria-selected', async () => {
    const trigger = wrapper.find('.flexrow')
    await trigger.trigger('click')
    const optionLines = wrapper.findAll('.option-line')
    expect(optionLines[0].attributes('aria-selected')).toBe('true')
    expect(optionLines[1].attributes('aria-selected')).toBe('false')
  })

  it('toggles the active option on Enter via keyboard', async () => {
    const trigger = wrapper.find('.flexrow')
    // 1st ArrowDown opens, the next two move the cursor to index 1
    // (bigThumbnails).
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:model-value')[0]).toEqual([
      { showInfos: true, bigThumbnails: true }
    ])
  })

  it('keeps the list open after selecting via keyboard', async () => {
    const trigger = wrapper.find('.flexrow')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('.select-input').exists()).toBe(true)
  })

  it('closes the dropdown on Escape', async () => {
    const trigger = wrapper.find('.flexrow')
    await trigger.trigger('click')
    expect(wrapper.find('.select-input').exists()).toBe(true)
    await trigger.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.select-input').exists()).toBe(false)
  })
})
