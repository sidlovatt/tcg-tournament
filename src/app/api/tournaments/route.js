import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/roomCode'
import { getSwissRounds } from '@/lib/gamePresets'
import { generateSwissPairings, applyBye } from '@/lib/swiss'
import { generateSingleElimPairings, generateDoubleElimPairings } from '@/lib/knockout'

export async function POST(request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { name, type, game, format, timerMinutes, playerNames, qrMode, customRounds } = body

    // Get user from auth token if provided
    let userId = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id ?? null
    }

    if (!name || !type || !game || !format || !timerMinutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!qrMode && (!playerNames?.length || playerNames.length < 2)) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
    }

    // Generate unique room code
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('tournaments')
        .select('id')
        .eq('code', code)
        .single()
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }

    const totalRounds = type === 'swiss' ? (customRounds || getSwissRounds((playerNames || []).length)) : 0

    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .insert({ code, name, type, game, format, timer_minutes: timerMinutes, total_rounds: totalRounds, user_id: userId })
      .select()
      .single()

    if (tErr) throw tErr

    if (!qrMode && playerNames?.length) {
      const { error: pErr } = await supabase
        .from('players')
        .insert(playerNames.map(n => ({ tournament_id: tournament.id, name: n.trim() })))
      if (pErr) throw pErr
    }

    return NextResponse.json({ code: tournament.code, id: tournament.id })
  } catch (err) {
    console.error('Create tournament error:', err)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
