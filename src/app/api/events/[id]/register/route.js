import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function getUserIdFromToken(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload.sub || null
  } catch { return null }
}

export async function POST(request, { params }) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { display_name } = await request.json()
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('event_registrations')
      .insert({ event_id: id, user_id: userId, display_name: display_name || null })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Already registered' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ registration: data })
  } catch {
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
  }
}
