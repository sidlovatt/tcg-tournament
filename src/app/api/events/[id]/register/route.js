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

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { display_name } = await request.json()

    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: id,
        user_id: user.id,
        display_name: display_name || user.user_metadata?.full_name || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Already registered' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ registration: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
  }
}
