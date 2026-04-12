import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Minimal OpenNext config. The default incremental cache uses Workers KV
// when `cache = kvIncrementalCache` is set; left at defaults here so the
// app works on a fresh account with no extra bindings.

export default defineCloudflareConfig({})
