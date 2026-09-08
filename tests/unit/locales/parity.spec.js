import { describe, expect, it } from 'vitest'

import en from '@/locales/en'
import { localeLoaders } from '@/locales'

// vue-i18n falls back to en, so a key missing from a locale renders in
// English without warning. Nothing but this check catches it.
const flatten = (messages, prefix = '') =>
  Object.entries(messages).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]
  )

const enEntries = flatten(en)
const enKeys = new Set(enEntries.map(([key]) => key))
const enPlurals = new Map(
  enEntries
    .filter(([, value]) => typeof value === 'string' && value.includes('|'))
    .map(([key, value]) => [key, value.split('|').length])
)

const locales = Object.keys(localeLoaders)

// Same access path as loadLocaleMessages: the files nest under "default".
const loadLocale = async locale =>
  new Map(flatten((await localeLoaders[locale]()).default.default))

describe('locales', () => {
  it.each(locales)('%s translates every key of en.js', async locale => {
    const messages = await loadLocale(locale)
    expect([...enKeys].filter(key => !messages.has(key))).toEqual([])
  })

  it.each(locales)('%s keeps no key en.js has dropped', async locale => {
    const messages = await loadLocale(locale)
    expect([...messages.keys()].filter(key => !enKeys.has(key))).toEqual([])
  })

  it.each(locales)('%s keeps the plural segments of en.js', async locale => {
    const messages = await loadLocale(locale)
    // Every locale uses the default plural resolver, which picks the segment
    // by index: an extra grammatical form shifts the whole message.
    const mismatched = [...enPlurals.entries()]
      .filter(([key, count]) => messages.get(key)?.split('|').length !== count)
      .map(([key]) => key)
    expect(mismatched).toEqual([])
  })
})
