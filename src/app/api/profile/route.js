import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function getUser(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  // Validate token with a minimal auth client
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await authClient.auth.getUser(token)
  return user || null
}

export async function GET(request) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = getServiceClient()
    const { data } = await db.from('profiles').select('username').eq('id', user.id).maybeSingle()
    return NextResponse.json({ username: data?.username || null })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username } = await request.json()
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    const clean = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      return NextResponse.json({ error: 'Username must be 3–20 characters: letters, numbers, underscores only' }, { status: 400 })
    }

    const db = getServiceClient()
    const { error } = await db
      .from('profiles')
      .upsert({ id: user.id, username: clean }, { onConflict: 'id' })

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ username: clean })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed to update username' }, { status: 500 })
  }
}
