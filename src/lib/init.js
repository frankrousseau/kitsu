import drafts from '@/lib/drafts'
import router from '@/router'
import store from '@/store'

import { DATA_LOADING_START, DATA_LOADING_END } from '@/store/mutation-types'

/**
 * Load base data required to display properly all information.
 * Resolves to true when the app is ready, false when the navigation was
 * aborted (redirect to the 2FA page); rejects when the server is down.
 */
const init = () => {
  store.commit(DATA_LOADING_START)
  // Scope comment drafts to the logged-in user: on a shared workstation
  // the next user must not see them.
  drafts.setUserScope(store.state.user.user?.id)
  return store
    .dispatch('loadContext')
    .then(() => {
      return store.dispatch('getOrganisation')
    })
    .then(() => {
      // We run login success mutation when done because init
      // happens either after successful login or at first connexion
      // when the user have an active session.
      store.commit(DATA_LOADING_END)
      return true
    })
    .catch(err => {
      store.commit(DATA_LOADING_END)
      if (err.status === 403) {
        router.push({ name: 'login-2fa' })
        return false
      }
      console.error('An init operation failed: ', err)
      throw err
    })
}

export default init
