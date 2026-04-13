// Next.js middleware that runs on the Worker (OpenNext) edge.
//
// Two jobs:
//
//  1. Locale-aware entry routing. The PWA's manifest now declares
//     `start_url: "/"` so iOS Safari treats every locale (id/en/ar) as the
//     same standalone scope — without that, switching language inside the
//     installed app dropped you back into Safari with the URL bar visible.
//     But "/" is not a real Next route, so we redirect it here based on
//     the user's previously chosen locale (cookie) or a sensible default.
//
//  2. Persisting locale across PWA cold-starts. The language toggle in
//     MobileSettings now writes a `NEXT_LOCALE` cookie. On a cold launch
//     the PWA hits `/`, this middleware reads that cookie, and routes the
//     user back to where they left off in their preferred language —
//     instead of always landing in `id` like before.
//
// The middleware runs on Cloudflare Workers via OpenNext; it is *cheap*
// (one cookie read + a redirect or rewrite) and doesn't touch the DB.

import { NextResponse, type NextRequest } from 'next/server'

import { i18n, type Locale } from '@configs/i18n'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const DEFAULT_DASHBOARD = '/apps/tabungan/dashboard'

const isValidLocale = (value: string | undefined): value is Locale =>
  !!value && (i18n.locales as readonly string[]).includes(value)

const pickLocale = (req: NextRequest): Locale => {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value

  if (isValidLocale(cookieLocale)) return cookieLocale

  // Fall back to Accept-Language; first match wins. Workers don't expose
  // Negotiator's full machinery cheaply, so a small manual scan is fine.
  const accept = req.headers.get('accept-language') || ''

  for (const tag of accept.split(',')) {
    const code = tag.split(';')[0]?.trim().slice(0, 2).toLowerCase()

    if (isValidLocale(code)) return code
  }

  return i18n.defaultLocale as Locale
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Already locale-prefixed (e.g. /id/..., /en/..., /ar/...) — let it through.
  if (i18n.locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next()
  }

  const locale = pickLocale(req)

  // Root entry — usually a PWA cold-start. Route the user straight to the
  // dashboard in their preferred language so they never see a flash of
  // the wrong locale.
  if (pathname === '/' || pathname === '') {
    const url = req.nextUrl.clone()

    url.pathname = `/${locale}${DEFAULT_DASHBOARD}`

    return NextResponse.redirect(url)
  }

  // Anything else without a locale prefix (e.g. shared deep links like
  // /apps/tabungan/transactions) — prepend the picked locale so the
  // route resolves under the existing `[lang]` segment.
  const url = req.nextUrl.clone()

  url.pathname = `/${locale}${pathname}`
  url.search = search

  return NextResponse.redirect(url)
}

// Skip Next internals, the API routes (which have their own auth flow),
// the manifest/sw, and any path that looks like a static asset.
export const config = {
  matcher: ['/((?!_next|api|favicon.ico|manifest.json|sw.js|workbox-.*|robots.txt|sitemap.xml|icons/|images/|.*\\..*).*)']
}
