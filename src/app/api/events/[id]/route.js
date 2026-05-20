import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params

    const { data, error } = await supabase
      .from('events')
      .select('*, event_registrations(id, status, display_name, user_id, created_at)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ event: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await request.json()
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
