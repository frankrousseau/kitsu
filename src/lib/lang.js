import moment from 'moment-timezone'
import { ref } from 'vue'

// Moment locales matching src/locales/ (English is built-in).
import 'moment/locale/da'
import 'moment/locale/de'
import 'moment/locale/es'
import 'moment/locale/fa'
import 'moment/locale/fr'
import 'moment/locale/hu'
import 'moment/locale/ja'
import 'moment/locale/ko'
import 'moment/locale/nl'
import 'moment/locale/pt'
import 'moment/locale/ru'
import 'moment/locale/zh-cn'
import 'moment/locale/zh-tw'

import i18n from '@/lib/i18n'

// Importing a locale file activates it; default back to English.
moment.locale('en')

const LOCALE_MAP = {
  zh_Hans_CN: { language: 'zh', code: 'zh-cn' },
  zh_Hant_TW: { language: 'zh_tw', code: 'zh-tw' }
}

// Reactive, Intl-safe formatting code for the active language ('en', 'zh-tw', …).
export const localeCode = ref('en')

export default {
  /**
   * Set the locale for the application (vue-i18n + moment.js)
   * @param {string} locale
   */
  setLocale(locale) {
    const fallback = locale?.substring(0, 2) || 'en'
    const { language, code } = LOCALE_MAP[locale] || {
      language: fallback,
      code: fallback
    }

    moment.locale(code)

    i18n.global.locale = language
    localeCode.value = code
  }
}
