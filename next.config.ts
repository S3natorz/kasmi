import path from 'node:path'

import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

// Initialise OpenNext Cloudflare bindings during `next dev`. Safe no-op on
// other environments. The dynamic import keeps the module optional at
// build time if you later decide to deploy elsewhere.
if (process.env.NEXT_RUNTIME !== 'edge' && process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare')
    .then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev())
    .catch(() => {
      /* optional */
    })
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  turbopack: {},

  // Prisma's `prisma-client` generator emits
  //   await import('./query_engine_bg.wasm?module')
  // inside `src/generated/prisma/internal/class.ts`. That `?module` suffix
  // is Cloudflare Workers' native wasm-import syntax — OpenNext's esbuild
  // pass (`setWranglerExternal`) marks such imports as external so wrangler
  // can bundle the .wasm as a `CompiledWasm` module at deploy time.
  //
  // If we let webpack process the import, webpack's default async-wasm
  // loader compiles it into a runtime `require('fs').readFile('static/wasm/
  // <hash>.wasm', cb)`. That crashes on Cloudflare (`[unenv] fs.readFile is
  // not implemented yet!`) and also tries to compile WebAssembly at runtime
  // (blocked by Workers' `Wasm code generation disallowed by embedder`).
  //
  // The fix is to mark any `*.wasm` / `*.wasm?module` import as a webpack
  // external so webpack emits the import statement verbatim. OpenNext's
  // esbuild then rewrites the relative path and wrangler does the rest.
  webpack: (config, { isServer }) => {
    if (isServer) {
      const wasmExternal = (
        { context, request }: { context?: string; request?: string },
        callback: (err?: unknown, result?: string) => void
      ) => {
        if (!request || !/\.wasm(\?module)?$/.test(request)) {
          return callback()
        }

        // Resolve relative paths to absolute paths ourselves so OpenNext's
        // esbuild externals plugin doesn't re-resolve them relative to each
        // per-route chunk directory (where the file doesn't exist). Using an
        // absolute path that points at the real generated wasm on disk lets
        // wrangler locate it at deploy time and bundle it as CompiledWasm.
        const resolved = request.startsWith('.') && context ? path.resolve(context, request) : request

        return callback(null, `module ${resolved}`)
      }

      const existing = config.externals

      if (Array.isArray(existing)) {
        config.externals = [wasmExternal, ...existing]
      } else if (existing) {
        config.externals = [wasmExternal, existing]
      } else {
        config.externals = [wasmExternal]
      }
    }

    return config
  },

  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/id/apps/tabungan/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(id|en|ar)',
        destination: '/:lang/apps/tabungan/dashboard',
        permanent: true,
        locale: false
      },
      {
        source:
          '/:path((?!id|en|ar|front-pages|images|api|icons|favicon.ico|manifest.json|apple-touch-icon|icon-|sw.js|workbox-).*)*',
        destination: '/id/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default pwaConfig(nextConfig)
