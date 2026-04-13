import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Minimal OpenNext config. The default incremental cache uses Workers KV
// when `cache = kvIncrementalCache` is set; left at defaults here so the
// app works on a fresh account with no extra bindings.
//
// The `build` npm script is pinned to `next build --webpack` — Next 16's
// default Turbopack builder externalises `pg` with a hashed module id
// that OpenNext's Cloudflare adapter can't resolve at runtime ("Failed
// to load external module pg-<hash>"). Webpack keeps `pg` inlined so
// the Prisma driver works on Workers via nodejs_compat.

export default defineCloudflareConfig({})
