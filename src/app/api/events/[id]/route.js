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

export async function GET(request, { params }) {
  try {
    const supabase = getServiceClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('events')
      .select('*, event_registrations(id, status, display_name, user_id, created_at)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ event: data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const updates = await request.json()
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
