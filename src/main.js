import { configureCompat, createApp } from 'vue'
import { sync } from 'vuex-router-sync'

import App from './App'
import i18n from './lib/i18n'
import resizableColumn from './directives/resizable-column'
import router from './router'
import store from './store'

import Autocomplete from 'v-autocomplete'
import Chart from 'chart.js'
import Meta from 'vue-meta'
import appChartkick from 'vue-chartkick'
import appCookie from 'vue-cookie'
import appDragDrop from 'vue-drag-drop'
import appLazyload from 'vue-lazyload'
import vuescroll from 'vue-scroll'
import appTextareaAutosize from 'vue-textarea-autosize'
import VTooltip from 'v-tooltip'
import appWebsocket from 'vue-websocket'

import 'v-autocomplete/dist/v-autocomplete.css'

configureCompat({
  OPTIONS_DATA_FN: false
})

const app = createApp(App)

app.use(i18n)
app.use(router)
app.use(store)
app.use(appWebsocket, '/events')
app.use(Autocomplete)
app.use(Meta)
app.use(resizableColumn)
app.use(VTooltip)
app.use(appChartkick, { adapter: Chart })
app.use(appCookie)
app.use(appLazyload)
app.use(vuescroll)
app.use(appDragDrop)
app.use(appTextareaAutosize)

// Make the current route part of the main state.
sync(store, router)

// Global custom directive to enable automatic focus on field after page
// loading.
app.directive('focus', {
  inserted (el) {
    el.focus()
  }
})

// Allow access to i18n object from vue instance.
app.config.globalProperties.$locale = {
  change (locale) {
    i18n.locale = locale
  },
  current () {
    return i18n.locale
  }
}

app.config.keyCodes = { backspace: 8 }
app.mount('#app')
