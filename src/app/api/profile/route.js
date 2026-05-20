import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAuthenticatedClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

async function getUserAndClient(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return {}
  const token = authHeader.replace('Bearer ', '')
  const db = getAuthenticatedClient(token)
  const { data: { user } } = await db.auth.getUser(token)
  return { user: user || null, db }
}

export async function GET(request) {
  try {
    const { user, db } = await getUserAndClient(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await db.from('profiles').select('username').eq('id', user.id).maybeSingle()
    return NextResponse.json({ username: data?.username || null })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { user, db } = await getUserAndClient(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username } = await request.json()
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    const clean = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      return NextResponse.json({ error: 'Username must be 3–20 characters: letters, numbers, underscores only' }, { status: 400 })
    }

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
