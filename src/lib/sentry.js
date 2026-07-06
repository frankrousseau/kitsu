import * as Sentry from '@sentry/vue'

import { name, version } from '@/../package.json'
import { isChunkError } from '@/lib/chunk-error'

// The guest share URL carries its access token in the path: strip it from
// everything Sentry reports.
const SHARED_TOKEN_RGX = /(\/playlists\/shared\/)[^/?#\s]+/g
export const scrubSharedToken = value =>
  typeof value === 'string'
    ? value.replace(SHARED_TOKEN_RGX, '$1[token]')
    : value

const scrubEvent = event => {
  if (event.request?.url) {
    event.request.url = scrubSharedToken(event.request.url)
  }
  event.transaction = scrubSharedToken(event.transaction)
  event.breadcrumbs?.forEach(crumb => {
    if (!crumb.data) return
    crumb.data.from = scrubSharedToken(crumb.data.from)
    crumb.data.to = scrubSharedToken(crumb.data.to)
    crumb.data.url = scrubSharedToken(crumb.data.url)
  })
  return event
}

export default {
  init(app, router, { dsn, sampleRate = 0.1 }) {
    Sentry.init({
      Vue: app,
      dsn,
      enabled: import.meta.env.PROD,
      release: `${name}@${version}`,
      integrations: [
        Sentry.browserTracingIntegration({
          router
        })
      ],
      tracesSampleRate: sampleRate, // capture Trace for % of transactions for performance monitoring
      beforeSend(event, hint) {
        if (hint.originalException && isChunkError(hint.originalException)) {
          return null
        }
        return scrubEvent(event)
      },
      beforeSendTransaction(event) {
        return scrubEvent(event)
      }
    })
  },

  setContext(organisation, user) {
    Sentry.setTag('kitsu.org', organisation.name)
    Sentry.setTag('kitsu.role', user.role)
    Sentry.setUser({
      id: user.id,
      locale: user.locale,
      timezone: user.timezone
    })
  }
}
