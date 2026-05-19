import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { code } = await params
    const body = await request.json()
    const { action } = body // 'start' | 'pause' | 'reset'

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, timer_started_at, timer_paused_at, timer_minutes')
      .eq('code', code)
      .single()

    if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let update = {}
    const now = new Date().toISOString()

    if (action === 'start') {
      if (tournament.timer_paused_at && tournament.timer_started_at) {
        // Resume: shift start time forward by paused duration
        const pausedMs = new Date(now) - new Date(tournament.timer_paused_at)
        const newStart = new Date(new Date(tournament.timer_started_at).getTime() + pausedMs).toISOString()
        update = { timer_started_at: newStart, timer_paused_at: null }
      } else {
        update = { timer_started_at: now, timer_paused_at: null }
      }
    } else if (action === 'pause') {
      update = { timer_paused_at: now }
    } else if (action === 'reset') {
      update = { timer_started_at: null, timer_paused_at: null }
    }

    await supabase.from('tournaments').update(update).eq('id', tournament.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Timer error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
