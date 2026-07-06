import en from '@/locales/en'
import en_nft from '@/locales/en_nft'
import en_video_game from '@/locales/en_video-game'

// English and its production-style overlays stay in the main bundle: en is
// the i18n fallback and App.vue switches to the overlays synchronously.
// Translations load on demand through localeLoaders, one chunk per locale.
export default {
  en,
  en_nft,
  'en_video-game': en_video_game
}

export const localeLoaders = {
  da: () => import('@/locales/da.json'),
  de: () => import('@/locales/de.json'),
  es: () => import('@/locales/es.json'),
  fa: () => import('@/locales/fa.json'),
  fr: () => import('@/locales/fr.json'),
  hu: () => import('@/locales/hu.json'),
  it: () => import('@/locales/it.json'),
  ja: () => import('@/locales/ja.json'),
  ko: () => import('@/locales/ko.json'),
  nl: () => import('@/locales/nl.json'),
  pl: () => import('@/locales/pl.json'),
  pt: () => import('@/locales/pt.json'),
  ru: () => import('@/locales/ru.json'),
  zh: () => import('@/locales/zh.json'),
  zh_tw: () => import('@/locales/zh_tw.json')
}
