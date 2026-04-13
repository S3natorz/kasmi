export const i18n = {
  defaultLocale: 'id',
  locales: ['id', 'en', 'ar'],
  langDirection: {
    id: 'ltr',
    en: 'ltr',
    ar: 'rtl'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
