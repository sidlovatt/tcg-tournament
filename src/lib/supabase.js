import { createClient } from '@supabase/supabase-js'

let _client = null

function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient(url, key, {
      auth: { flowType: 'pkce' },
    })
  }
  return _client
}

// Lazy proxy — only creates client on first method call (not at module import)
export const supabase = new Proxy(
  {},
  { get: (_, prop) => getClient()[prop] }
)

// For API routes that need the client directly
export { getClient as getSupabase }
