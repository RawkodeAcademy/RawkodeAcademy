// Minimal shared binding types for the control-plane Worker
export interface SecretsStoreSecret {
  get(): Promise<string | null>
}

export interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ success: boolean }>
      first<T = unknown>(col?: string): Promise<T | null>
      all<T = unknown>(): Promise<{ results: T[] }>
    }
  }
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId
  get(id: DurableObjectId): DurableObjectStub
}
export interface DurableObjectId {}
export interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string | Blob, options?: { httpMetadata?: any }): Promise<R2Object | null>
  head(key: string): Promise<R2Object | null>
  delete(key: string): Promise<void>
}
export interface R2Object { key: string; size: number }

// Cloudflare Worker bindings for this service
export interface Bindings {
  DB: D1Database
  SHOWS: DurableObjectNamespace
  SESSIONS: DurableObjectNamespace
  R2_MEDIA: R2Bucket

  // RTK configuration and secrets
  RTK_APP_ID?: string
  RTK_BASE_URL?: string
  RTK_APP_SECRET?: string
  RTK_FAKE?: string
  STUDIO_REALTIME_TOKEN?: SecretsStoreSecret
}

