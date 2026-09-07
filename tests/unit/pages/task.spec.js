import { flushPromises, shallowMount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@unhead/vue', () => ({ useHead: vi.fn() }))
vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal()),
  useI18n: () => ({ t: key => key })
}))

// Pre-load the real store to avoid a circular-import race from child components.
import '@/lib/auth'

import Task from '@/components/pages/Task.vue'
import AddComment from '@/components/widgets/AddComment.vue'

// The ten events the page used to declare through the `socket` component
// option, which `<script setup>` cannot express.
const SOCKET_EVENTS = [
  'preview-file:add-file',
  'preview-file:update',
  'preview-file:annotation-update',
  'comment:acknowledge',
  'comment:unacknowledge',
  'comment:new',
  'comment:update',
  'comment:reply',
  'comment:delete',
  'comment:delete-reply'
]

const TASK_ID = 'task-1'
const taskType = {
  id: 'task-type-1',
  name: 'Animation',
  for_entity: 'Shot',
  department_id: null
}

const buildTask = (overrides = {}) => ({
  id: TASK_ID,
  entity_id: 'entity-1',
  entity_type_name: 'Shot',
  entity_name: 'SH01',
  task_type_id: taskType.id,
  project_id: 'production-1',
  assignees: [],
  entity: { id: 'entity-1' },
  data: {},
  ...overrides
})

const mountPage = async ({
  task = buildTask(),
  getterOverrides = {},
  comments = []
} = {}) => {
  const dispatched = []
  const socket = { on: vi.fn(), off: vi.fn() }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'open-productions', component: { template: '<div />' } },
      { path: '/task/:task_id', name: 'task', component: { template: '<div />' } }
    ]
  })
  await router.push({ name: 'task', params: { task_id: TASK_ID } })
  await router.isReady()

  const store = createStore({
    getters: {
      assetMap: () => new Map(),
      currentEpisode: () => null,
      currentProduction: () => ({
        id: 'production-1',
        team: [],
        task_types: [taskType.id],
        fps: 25
      }),
      dateFormat: () => 'dd/MM/yyyy',
      editMap: () => new Map(),
      episodeMap: () => new Map(),
      getTaskComment: () => () => null,
      getTaskComments: () => () => comments,
      getTaskPreviews: () => () => [],
      isCurrentUserArtist: () => false,
      isCurrentUserClient: () => false,
      isCurrentUserProductionManager: () => false,
      isCurrentUserProductionSupervisor: () => false,
      isTVShow: () => false,
      organisation: () => ({ format_duration_in_hours: false }),
      personMap: () => new Map(),
      productionMap: () => new Map([['production-1', { fps: 25 }]]),
      sequenceMap: () => new Map(),
      shotMap: () => new Map(),
      taskEntityPreviews: () => [],
      taskMap: () => new Map(task ? [[task.id, task]] : []),
      taskMetadataDescriptors: () => [],
      taskStatusForCurrentUser: () => null,
      taskTypeMap: () => new Map([[taskType.id, taskType]]),
      user: () => ({ id: 'user-1', departments: [] }),
      ...getterOverrides
    }
  })
  // Record every dispatch while letting the unregistered ones resolve.
  store.dispatch = vi.fn(type => {
    dispatched.push(type)
    if (type === 'loadTask') return Promise.resolve(task)
    return Promise.resolve()
  })
  store.commit = vi.fn()

  const wrapper = shallowMount(Task, {
    global: {
      stubs: {
        // reset() runs on every page reset; the default stub has no such
        // method and the resulting throw would cut the reset short.
        AddPreviewModal: { template: '<div />', methods: { reset: () => {} } },
        // The default stub swallows its slot, which holds the page title.
        RouterLink: { template: '<a><slot /></a>' }
      },
      plugins: [
        router,
        store,
        {
          install: app => {
            app.config.globalProperties.$socket = socket
          }
        }
      ]
    }
  })
  await flushPromises()
  return { wrapper, socket, dispatched, store }
}

describe('Task.vue', () => {
  describe('socket subscriptions', () => {
    it('subscribes to every task event on mount', async () => {
      const { socket } = await mountPage()
      const subscribed = socket.on.mock.calls.map(([event]) => event)
      expect(subscribed).toEqual(expect.arrayContaining(SOCKET_EVENTS))
      expect(subscribed).toHaveLength(SOCKET_EVENTS.length)
    })

    it('unsubscribes the very same handlers on unmount', async () => {
      const { wrapper, socket } = await mountPage()
      expect(socket.off).not.toHaveBeenCalled()

      wrapper.unmount()

      // Passing a different function reference would leave the listener
      // attached, so compare the pairs rather than just the event names.
      expect(socket.off.mock.calls).toEqual(socket.on.mock.calls)
    })
  })

  describe('entity type driven loading', () => {
    it('loads shots for a shot task', async () => {
      const { dispatched } = await mountPage()
      expect(dispatched).toContain('loadShots')
      expect(dispatched).not.toContain('loadAssets')
    })

    it('loads assets for a task on any other entity type', async () => {
      const { dispatched } = await mountPage({
        task: buildTask({ entity_type_name: 'Concept' })
      })
      expect(dispatched).toContain('loadAssets')
      expect(dispatched).not.toContain('loadShots')
    })

    it('loads episodes for an episode task', async () => {
      const { dispatched } = await mountPage({
        task: buildTask({ entity_type_name: 'Episode' })
      })
      expect(dispatched).toContain('loadEpisodes')
    })

    it('clears the task selection on mount', async () => {
      const { dispatched } = await mountPage()
      expect(dispatched).toContain('clearSelectedTasks')
    })
  })

  describe('title', () => {
    it('shows the entity name', async () => {
      const { wrapper } = await mountPage()
      expect(wrapper.find('h1.title').text()).toContain('SH01')
    })

    it('strips the episode segment of a shot name on a TV show', async () => {
      const { wrapper } = await mountPage({
        task: buildTask({ full_entity_name: 'E01/SQ01/SH01' }),
        getterOverrides: { isTVShow: () => true }
      })
      expect(wrapper.find('h1.title').text()).toContain('SQ01/SH01')
      expect(wrapper.find('h1.title').text()).not.toContain('E01')
    })
  })

  describe('commenting permissions', () => {
    it('hides the comment form for an unrelated artist', async () => {
      const { wrapper } = await mountPage()
      expect(wrapper.findComponent(AddComment).exists()).toBe(false)
    })

    it('shows the comment form to an assignee', async () => {
      const { wrapper } = await mountPage({
        task: buildTask({ assignees: ['user-1'] })
      })
      expect(wrapper.findComponent(AddComment).exists()).toBe(true)
    })

    it('shows the comment form to someone mentioned in a comment', async () => {
      const { wrapper } = await mountPage({
        comments: [{ id: 'comment-1', mentions: ['user-1'], replies: [] }]
      })
      expect(wrapper.findComponent(AddComment).exists()).toBe(true)
    })

    it('shows the comment form to someone mentioned in a reply', async () => {
      const { wrapper } = await mountPage({
        comments: [
          {
            id: 'comment-1',
            mentions: [],
            replies: [{ id: 'reply-1', mentions: ['user-1'] }]
          }
        ]
      })
      expect(wrapper.findComponent(AddComment).exists()).toBe(true)
    })

    it('locks the status when the user is only mentioned, not assigned', async () => {
      const { wrapper } = await mountPage({
        comments: [{ id: 'comment-1', mentions: ['user-1'], replies: [] }]
      })
      expect(wrapper.findComponent(AddComment).props('isStatusLocked')).toBe(
        true
      )
    })

    it('leaves the status unlocked for an assignee', async () => {
      const { wrapper } = await mountPage({
        task: buildTask({ assignees: ['user-1'] })
      })
      expect(wrapper.findComponent(AddComment).props('isStatusLocked')).toBe(
        false
      )
    })
  })

  describe('task metadata', () => {
    const descriptor = {
      id: 'descriptor-1',
      name: 'Difficulty',
      field_name: 'difficulty',
      data_type: 'boolean',
      task_type_id: taskType.id
    }

    it('renders a boolean descriptor through its translation key', async () => {
      const { wrapper } = await mountPage({
        task: buildTask({ data: { difficulty: 'true' } }),
        getterOverrides: { taskMetadataDescriptors: () => [descriptor] }
      })
      expect(wrapper.text()).toContain('main.yes')
    })

    it('keeps a descriptor of another task type out of the table', async () => {
      const { wrapper } = await mountPage({
        task: buildTask({ data: { difficulty: 'true' } }),
        getterOverrides: {
          taskMetadataDescriptors: () => [
            { ...descriptor, task_type_id: 'task-type-2' }
          ]
        }
      })
      expect(wrapper.text()).not.toContain('Difficulty')
    })
  })
})
