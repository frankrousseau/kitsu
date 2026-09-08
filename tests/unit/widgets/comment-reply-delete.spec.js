import { shallowMount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'

vi.mock('moment', async () => {
  const actual = await vi.importActual('moment')
  const moment = actual.default || actual
  const wrap = value => {
    value.tz = () => value
    return value
  }
  const wrapped = (...args) => wrap(moment(...args))
  Object.assign(wrapped, moment)
  return { default: wrapped, ...wrapped }
})

import Comment from '@/components/widgets/Comment.vue'
import i18n from '@/lib/i18n'

import './setup'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/tasks/:id', name: 'task', component: { template: '' } }]
})

const makeComment = replyAuthorId => ({
  id: 'comment-1',
  text: 'A comment',
  mentions: [],
  department_mentions: [],
  links: [],
  previews: [],
  replies: [
    {
      id: 'reply-1',
      text: 'A reply',
      mentions: [],
      department_mentions: [],
      person_id: replyAuthorId,
      person: { id: replyAuthorId, role: 'user' },
      date: '2026-06-06T11:00:00'
    }
  ],
  checklist: [],
  acknowledgements: [],
  person_id: 'person-1',
  object_id: 'task-1',
  created_at: '2026-06-06T10:00:00',
  task_status: { id: 'task-status-1', color: '#ECECEC' },
  person: { id: 'person-1', role: 'user' },
  attachment_files: []
})

const task = {
  id: 'task-1',
  task_type_id: 'task-type-1',
  project_id: 'production-1'
}

// user is null for the anonymous guests of a shared playlist, so the guard has
// to survive that too.
const makeStore = ({ isAdmin = false, user = { id: 'person-1' } } = {}) =>
  createStore({
    getters: {
      dateFormat: () => 'dd/MM/yyyy',
      departmentMap: () => new Map(),
      isCurrentUserAdmin: () => isAdmin,
      isCurrentUserArtist: () => false,
      isCurrentUserClient: () => false,
      isCurrentUserManager: () => false,
      currentUserRoleForProduction: () => () => null,
      personMap: () => new Map([['person-1', { id: 'person-1' }]]),
      productionDepartmentIds: () => [],
      taskTypeMap: () =>
        new Map([['task-type-1', { id: 'task-type-1', for_entity: 'Asset' }]]),
      use12HourClock: () => false,
      user: () => user
    }
  })

const mountComment = (replyAuthorId, storeOptions) =>
  shallowMount(Comment, {
    props: {
      comment: makeComment(replyAuthorId),
      isEditable: true,
      task,
      taskTypes: [],
      team: []
    },
    global: {
      plugins: [i18n, makeStore(storeOptions), router],
      stubs: { AddAttachmentModal: true, 'at-ta': true }
    }
  })

describe('Comment reply delete', () => {
  beforeAll(async () => {
    await router.push('/tasks/task-1')
    await router.isReady()
  })

  test('renders a reply for a non-admin reading someone else', () => {
    const wrapper = mountComment('person-2')
    expect(wrapper.text()).toContain('A reply')
    expect(wrapper.find('.reply-delete').exists()).toBe(false)
  })

  test('offers the delete button to the reply author', () => {
    const wrapper = mountComment('person-1')
    expect(wrapper.find('.reply-delete').exists()).toBe(true)
  })

  test('offers the delete button to an admin', () => {
    const wrapper = mountComment('person-2', { isAdmin: true })
    expect(wrapper.find('.reply-delete').exists()).toBe(true)
  })

  test('renders a reply for an anonymous guest', () => {
    const wrapper = mountComment('person-2', { user: null })
    expect(wrapper.text()).toContain('A reply')
    expect(wrapper.find('.reply-delete').exists()).toBe(false)
  })
})
