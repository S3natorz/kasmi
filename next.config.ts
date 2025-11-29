import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  turbopack: {},
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en/apps/tabungan/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/apps/tabungan/dashboard',
        permanent: true,
        locale: false
      },
      {
        source:
          '/:path((?!en|fr|ar|front-pages|images|api|icons|favicon.ico|manifest.json|apple-touch-icon|icon-|sw.js|workbox-).*)*',
        destination: '/en/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default pwaConfig(nextConfig)
