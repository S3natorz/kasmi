// Minimal structural types for the Cloudflare bindings consumed via
// `getCloudflareContext().env`. We deliberately avoid `/// <reference types>`
// to @cloudflare/workers-types here so those ambient declarations don't
// override the DOM's Request/Response/WebSocket types across the Next.js
// app. The real types live under workers/realtime/ where they're scoped.

interface CfDurableObjectId {
  toString(): string
}

interface CfDurableObjectStub {
  fetch(input: string | Request, init?: RequestInit): Promise<Response>
}

interface CfDurableObjectNamespace {
  idFromName(name: string): CfDurableObjectId
  get(id: CfDurableObjectId): CfDurableObjectStub
}

interface CloudflareEnv {
  REALTIME: CfDurableObjectNamespace
  REALTIME_SECRET: string
}
