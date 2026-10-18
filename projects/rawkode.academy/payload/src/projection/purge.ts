// Purges edge cache by tag. Purge-by-tag is available on every plan; one
// request takes up to 100 tags.
export type PurgeEnv = { CACHE_PURGE_TOKEN?: string; CACHE_PURGE_ZONE_ID?: string }

export async function purgeCacheTags(env: PurgeEnv, tags: string[], fetcher: typeof fetch = fetch): Promise<'purged' | 'not-configured'> {
  if (!env.CACHE_PURGE_TOKEN || !env.CACHE_PURGE_ZONE_ID) return 'not-configured'
  const unique = [...new Set(tags)]
  for (let start = 0; start < unique.length; start += 100) {
    const response = await fetcher(`https://api.cloudflare.com/client/v4/zones/${env.CACHE_PURGE_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.CACHE_PURGE_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ tags: unique.slice(start, start + 100) }),
    })
    const body = await response.json().catch(() => null) as { success?: boolean; errors?: unknown } | null
    if (!response.ok || body?.success === false) throw new Error(`Cache purge failed: ${response.status} ${JSON.stringify(body?.errors ?? body)}`)
  }
  return 'purged'
}
