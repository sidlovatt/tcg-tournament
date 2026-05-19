import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { generateSwissPairings, applyBye, getStandings } from '@/lib/swiss'
import { generateSingleElimPairings, generateDoubleElimPairings, nextSingleElimRound } from '@/lib/knockout'
import { getSwissRounds } from '@/lib/gamePresets'

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { code } = await params

    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code)
      .single()

    if (tErr || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const { data: players, error: playersErr } = await supabase
      .from('players')
      .select('*')
      .eq('tournament_id', tournament.id)

    if (playersErr) throw playersErr

    const { data: allPairings, error: pairingsErr } = await supabase
      .from('pairings')
      .select('*')
      .eq('tournament_id', tournament.id)

    if (pairingsErr) throw pairingsErr

    // Validate all current round results are submitted
    if (tournament.current_round > 0) {
      const currentRoundPairings = allPairings.filter(p => p.round === tournament.current_round)
      const pending = currentRoundPairings.filter(p => p.result === 'pending' && p.player2_id !== null)
      if (pending.length > 0) {
        return NextResponse.json({ error: 'Not all results submitted' }, { status: 400 })
      }
    }

    const nextRound = tournament.current_round + 1

    // Check if Swiss tournament is complete
    if (tournament.type === 'swiss' && nextRound > tournament.total_rounds) {
      await supabase.from('tournaments').update({ status: 'complete' }).eq('id', tournament.id)
      return NextResponse.json({ done: true })
    }

    let newPairings = []
    let luckyLoser = null

    if (tournament.type === 'swiss') {
      newPairings = generateSwissPairings(players, allPairings)
    } else if (tournament.type === 'single_elim') {
      if (tournament.current_round === 0) {
        // Seed by name (first round = random order)
        newPairings = generateSingleElimPairings(players)
      } else {
        const currentRoundPairings = allPairings.filter(p => p.round === tournament.current_round)
        const result = nextSingleElimRound(currentRoundPairings, players)
        if (result.done) {
          await supabase.from('tournaments').update({ status: 'complete' }).eq('id', tournament.id)
          return NextResponse.json({ done: true, winner: result.winner })
        }
        newPairings = result.pairings
        luckyLoser = result.luckyLoser
      }
    } else if (tournament.type === 'double_elim') {
      if (tournament.current_round === 0) {
        const { winnersPairings } = generateDoubleElimPairings(players)
        newPairings = winnersPairings.map(p => ({ ...p, bracket_round: 'winners' }))
      } else {
        const currentRoundPairings = allPairings.filter(p => p.round === tournament.current_round)
        const result = nextSingleElimRound(currentRoundPairings, players)
        if (result.done) {
          await supabase.from('tournaments').update({ status: 'complete' }).eq('id', tournament.id)
          return NextResponse.json({ done: true, winner: result.winner })
        }
        newPairings = result.pairings
        luckyLoser = result.luckyLoser
      }
    }

    // Handle byes for Swiss — apply immediately
    const byePairings = newPairings.filter(p => p.player2Id === null)
    const byeUpdates = []
    for (const byePairing of byePairings) {
      const player = players.find(p => p.id === byePairing.player1Id)
      if (player) {
        const updated = applyBye(player)
        byeUpdates.push(
          supabase.from('players').update({
            wins: updated.wins,
            points: updated.points,
            byes: updated.byes,
          }).eq('id', player.id)
        )
      }
    }
    await Promise.all(byeUpdates)

    // Re-activate lucky loser
    if (luckyLoser) {
      await supabase.from('players').update({ eliminated: false }).eq('id', luckyLoser.id)
    }

    // Insert pairings
    const pairingsToInsert = newPairings.map(p => ({
      tournament_id: tournament.id,
      round: nextRound,
      table_number: p.tableNumber,
      player1_id: p.player1Id,
      player2_id: p.player2Id || null,
      result: p.player2Id === null ? 'player1' : 'pending', // bye = auto-win
      bracket_round: p.bracket_round || null,
    }))

    const { error: insertErr } = await supabase.from('pairings').insert(pairingsToInsert)
    if (insertErr) throw insertErr

    // Recalculate total_rounds on Round 1 start only if it wasn't set at creation (QR mode creates with 0)
    const totalRounds = (tournament.type === 'swiss' && nextRound === 1 && tournament.total_rounds === 0)
      ? getSwissRounds(players.length)
      : tournament.total_rounds

    // Update tournament round and status
    await supabase.from('tournaments').update({
      current_round: nextRound,
      status: 'active',
      total_rounds: totalRounds,
      timer_started_at: null,
      timer_paused_at: null,
    }).eq('id', tournament.id)

    return NextResponse.json({ round: nextRound, luckyLoser: luckyLoser ? { id: luckyLoser.id, name: luckyLoser.name } : null })
  } catch (err) {
    console.error('Advance round error:', err)
    return NextResponse.json({ error: 'Failed to advance round' }, { status: 500 })
  }
}
