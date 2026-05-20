import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

async function getUser(request) {
  const supabase = getSupabase()
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  return user || null
}

export async function GET(request) {
  try {
    const supabase = getSupabase()
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    return NextResponse.json({ username: data?.username || null })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabase()
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username } = await request.json()
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    const clean = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      return NextResponse.json({ error: 'Username must be 3–20 characters: letters, numbers, underscores only' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: clean }, { onConflict: 'id' })

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ username: clean })
  } catch {
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
  }
}
