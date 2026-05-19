import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { applyResult } from '@/lib/swiss'

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    const body = await request.json()
    const { result, p1GameWins, p2GameWins, submittedBy } = body

    if (!['player1', 'player2', 'draw'].includes(result)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 400 })
    }

    const { data: pairing, error: pErr } = await supabase
      .from('pairings')
      .select('*')
      .eq('id', id)
      .single()

    if (pErr || !pairing) return NextResponse.json({ error: 'Pairing not found' }, { status: 404 })
    if (pairing.result !== 'pending') {
      return NextResponse.json({ error: 'Result already submitted' }, { status: 409 })
    }

    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabase.from('players').select('*').eq('id', pairing.player1_id).single(),
      pairing.player2_id
        ? supabase.from('players').select('*').eq('id', pairing.player2_id).single()
        : Promise.resolve({ data: null }),
    ])

    const { player1: updatedP1, player2: updatedP2 } = applyResult(
      result,
      p1GameWins ?? (result === 'player1' ? 1 : 0),
      p2GameWins ?? (result === 'player2' ? 1 : 0),
      p1,
      p2
    )

    // Update pairing result
    await supabase.from('pairings').update({
      result,
      player1_game_wins: p1GameWins ?? (result === 'player1' ? 1 : 0),
      player2_game_wins: p2GameWins ?? (result === 'player2' ? 1 : 0),
      submitted_by: submittedBy || 'player',
      pending_result: null,
      pending_claimed_by: null,
    }).eq('id', id)

    // Update player stats
    const playerUpdates = [
      supabase.from('players').update({
        points: updatedP1.points,
        wins: updatedP1.wins,
        losses: updatedP1.losses,
        draws: updatedP1.draws,
        game_wins: updatedP1.game_wins,
        game_losses: updatedP1.game_losses,
      }).eq('id', updatedP1.id),
    ]

    if (updatedP2) {
      playerUpdates.push(
        supabase.from('players').update({
          points: updatedP2.points,
          wins: updatedP2.wins,
          losses: updatedP2.losses,
          draws: updatedP2.draws,
          game_wins: updatedP2.game_wins,
          game_losses: updatedP2.game_losses,
        }).eq('id', updatedP2.id)
      )
    }

    // Mark eliminated for knockout
    if (pairing.bracket_round) {
      const loserId = result === 'player1' ? pairing.player2_id : pairing.player1_id
      if (loserId) {
        playerUpdates.push(
          supabase.from('players').update({ eliminated: true }).eq('id', loserId)
        )
      }
    }

    await Promise.all(playerUpdates)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit result error:', err)
    return NextResponse.json({ error: 'Failed to submit result' }, { status: 500 })
  }
}
