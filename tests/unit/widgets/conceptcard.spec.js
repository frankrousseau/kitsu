import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

// Importing the card transitively pulls in the root store
// (assets module → lib/models → timezone → @/store); stub it so no Vuex
// store is built.
vi.mock('@/store', () => ({ default: {} }))

import assetsStore from '@/store/modules/assets'

import ConceptCard from '@/components/widgets/ConceptCard.vue'
import EntityPreview from '@/components/widgets/EntityPreview.vue'
import ValidationTag from '@/components/widgets/ValidationTag.vue'

const asset = (id, name) => [id, { id, name, episode_id: null }]

const mountCard = (props = {}, links = []) =>
  shallowMount(ConceptCard, {
    props: {
      ...props,
      concept: {
        id: 'concept-1',
        created_by: 'person-1',
        entity_concept_links: links,
        tasks: [{ id: 'task-1', task_status_id: 'status-todo' }]
      }
    },
    global: {
      plugins: [
        createStore({
          getters: {
            currentProduction: () => ({ id: 'production-1' }),
            isTVShow: () => false,
            personMap: () => new Map(),
            taskStatusMap: () =>
              new Map([['status-todo', { color: '#999', short_name: 'todo' }]])
          }
        })
      ]
    }
  })

describe('ConceptCard', () => {
  // The concepts page reads the modifier keys to extend the selection.
  test('hands the click event over to its parent', async () => {
    const wrapper = mountCard()

    await wrapper.trigger('click', { ctrlKey: true })

    expect(wrapper.emitted('click')[0][0].ctrlKey).toBe(true)
  })

  test('carries the selection ring itself', () => {
    expect(mountCard({ selected: true }).classes()).toContain('selected')
    expect(mountCard().classes()).not.toContain('selected')
  })

  test('shows the status as a tinted chip', () => {
    const chip = mountCard().findComponent(ValidationTag)

    expect(chip.props('tinted')).toBe(true)
    expect(chip.props('task')).toEqual({
      id: 'task-1',
      task_status_id: 'status-todo'
    })
  })

  test('shows three links at most and counts the others', () => {
    assetsStore.cache.assetMap = new Map([
      asset('a1', 'Tree'),
      asset('a2', 'Rock'),
      asset('a3', 'Lake'),
      asset('a4', 'Hill')
    ])
    const wrapper = mountCard({}, ['a1', 'a2', 'a3', 'a4', 'missing'])

    expect(wrapper.findAll('.links .tag').map(tag => tag.text())).toEqual([
      'Tree',
      'Rock',
      'Lake'
    ])
    expect(wrapper.find('.more-links').text()).toBe('+1')
    expect(wrapper.find('.more-links').attributes('title')).toBe('Hill')
  })

  test('halves its preview when compact', () => {
    const preview = mountCard({ compact: true }).findComponent(EntityPreview)

    expect([preview.props('width'), preview.props('height')]).toEqual([
      150, 100
    ])
  })
})
