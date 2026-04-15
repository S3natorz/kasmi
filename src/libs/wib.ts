/**
 * Western Indonesia Time (WIB, UTC+7, "Asia/Jakarta") helpers.
 *
 * The app targets Indonesian users, but runs on Cloudflare Workers (UTC)
 * and in browsers spanning many time zones. Formatting / grouping with
 * the raw `Date` API (getFullYear, toDateString, toLocaleDateString with
 * no timeZone option, etc.) uses the host's local time, which silently
 * produces off-by-one-day bugs whenever the host is not in WIB.
 *
 * Everything date-shaped in the transaction flow goes through these
 * helpers so a single source of truth governs what "today" means.
 */

export const WIB_TZ = 'Asia/Jakarta'
export const WIB_OFFSET = '+07:00'

// YYYY-MM-DD in WIB. `sv-SE` happens to format as ISO date, which is
// what the <input type="date"> control and the API routes expect.
const DATE_KEY_FMT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: WIB_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

// YYYY-MM in WIB — used for the monthly picker.
const MONTH_KEY_FMT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: WIB_TZ,
  year: 'numeric',
  month: '2-digit'
})

/** Return the YYYY-MM-DD key for a date, evaluated in WIB. */
export const wibDateKey = (value: Date | string | number): string => {
  const date = value instanceof Date ? value : new Date(value)

  return DATE_KEY_FMT.format(date)
}

/** Return the YYYY-MM key for a date, evaluated in WIB. */
export const wibMonthKey = (value: Date | string | number): string => {
  const date = value instanceof Date ? value : new Date(value)

  return MONTH_KEY_FMT.format(date)
}

/** Today's YYYY-MM-DD in WIB. */
export const wibToday = (): string => wibDateKey(new Date())

/** This month's YYYY-MM in WIB. */
export const wibThisMonth = (): string => wibMonthKey(new Date())

/**
 * Parse a YYYY-MM-DD wall-clock date (as interpreted in WIB) into a
 * `Date` instant anchored at noon WIB. Noon keeps the instant far from
 * any day boundary so downstream code can read the date key in any zone
 * and still see the intended day.
 */
export const wibDateAtNoon = (dateKey: string): Date => {
  return new Date(`${dateKey}T12:00:00${WIB_OFFSET}`)
}

/** Start-of-day in WIB as a UTC instant — `2025-11-29T00:00:00+07:00`. */
export const wibStartOfDay = (dateKey: string): Date => {
  return new Date(`${dateKey}T00:00:00${WIB_OFFSET}`)
}

/** End-of-day (inclusive) in WIB as a UTC instant. */
export const wibEndOfDay = (dateKey: string): Date => {
  return new Date(`${dateKey}T23:59:59.999${WIB_OFFSET}`)
}

/** Is this the same calendar day in WIB? */
export const isSameWibDay = (a: Date | string | number, b: Date | string | number): boolean => {
  return wibDateKey(a) === wibDateKey(b)
}

/** Is the value today in WIB? */
export const isWibToday = (value: Date | string | number): boolean => {
  return wibDateKey(value) === wibToday()
}

/** Is the value yesterday in WIB? */
export const isWibYesterday = (value: Date | string | number): boolean => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  return wibDateKey(value) === wibDateKey(yesterday)
}

/**
 * Format a date for display in WIB using `id-ID` locale by default.
 * Callers can override the locale and pass any Intl options they need.
 */
export const formatWibDate = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale: string = 'id-ID'
): string => {
  const date = value instanceof Date ? value : new Date(value)

  return date.toLocaleDateString(locale, { ...options, timeZone: WIB_TZ })
}

/** Format a WIB date-key (YYYY-MM-DD) for display without the timezone drift a raw `new Date(key)` would introduce. */
export const formatWibDateKey = (
  dateKey: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale: string = 'id-ID'
): string => formatWibDate(wibDateAtNoon(dateKey), options, locale)

/** Day of week (0 = Sunday, 6 = Saturday) for the WIB calendar day of a date. */
export const getWibDayOfWeek = (value: Date | string | number): number => {
  const date = value instanceof Date ? value : new Date(value)
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: WIB_TZ, weekday: 'short' }).format(date)

  switch (weekday) {
    case 'Mon':
      return 1
    case 'Tue':
      return 2
    case 'Wed':
      return 3
    case 'Thu':
      return 4
    case 'Fri':
      return 5
    case 'Sat':
      return 6
    default:
      return 0
  }
}

/**
 * Build a [startDateKey, endDateKey] range for the WIB week containing
 * the given reference day. Week starts on Sunday to match the existing
 * `getDay()` based helpers.
 */
export const wibWeekRange = (referenceKey: string = wibToday()): { startDate: string; endDate: string } => {
  // Anchor at noon WIB so plain UTC arithmetic below stays on the right WIB day.
  const ref = wibDateAtNoon(referenceKey)
  const dayOfWeek = getWibDayOfWeek(ref)
  const start = new Date(ref.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)

  return { startDate: wibDateKey(start), endDate: wibDateKey(end) }
}

/** [start, end] date keys for a YYYY-MM month, in WIB. */
export const wibMonthRange = (monthKey: string): { startDate: string; endDate: string } => {
  const [yearStr, monthStr] = monthKey.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  // Last day of `month` = day 0 of `month + 1`.
  const lastDayDate = new Date(Date.UTC(year, month, 0))
  const lastDay = lastDayDate.getUTCDate()
  const pad = (n: number) => String(n).padStart(2, '0')

  return {
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${year}-${pad(month)}-${pad(lastDay)}`
  }
}
