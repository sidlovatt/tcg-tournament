'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Timer from '@/components/Timer'

export default function PlayerPage() {
  const { code } = useParams()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [pairings, setPairings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [p1GW, setP1GW] = useState('')
  const [p2GW, setP2GW] = useState('')
  const [showGameScore, setShowGameScore] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: t } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!t) { setError('Tournament not found'); setLoading(false); return }

    const [{ data: p }, { data: pa }] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', t.id).order('name'),
      supabase.from('pairings').select('*').eq('tournament_id', t.id),
    ])

    setTournament(t)
    setPlayers(p || [])
    setPairings(pa || [])
    setLoading(false)

    // Restore selected player from localStorage
    const saved = localStorage.getItem(`tcg_player_${code.toUpperCase()}`)
    if (saved) {
      const found = (p || []).find(pl => pl.id === saved)
      if (found) setSelectedPlayer(found)
    }
  }, [code])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!tournament) return
    const ch = supabase
      .channel(`player-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` },
        payload => { setTournament(payload.new); setSubmitted(false) }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('pairings').select('*').eq('tournament_id', tournament.id).then(({ data }) => {
          setPairings(data || [])
          setSubmitted(false)
        })
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tournament?.id])

  function selectPlayer(player) {
    setSelectedPlayer(player)
    localStorage.setItem(`tcg_player_${code.toUpperCase()}`, player.id)
    setSubmitted(false)
  }

  function getMyPairing() {
    if (!selectedPlayer) return null
    return pairings.find(
      p => p.round === tournament.current_round &&
        (p.player1_id === selectedPlayer.id || p.player2_id === selectedPlayer.id)
    )
  }

  function getOpponent(pairing) {
    if (!pairing || !selectedPlayer) return null
    const oppId = pairing.player1_id === selectedPlayer.id ? pairing.player2_id : pairing.player1_id
    return players.find(p => p.id === oppId) || null
  }

  async function submitResult(result) {
    const pairing = getMyPairing()
    if (!pairing || !selectedPlayer) return
    setSubmitting(true)
    try {
      const amP1 = pairing.player1_id === selectedPlayer.id
      const p1GameWins = tournament.format === 'bo3' && p1GW !== '' ? Number(p1GW) : undefined
      const p2GameWins = tournament.format === 'bo3' && p2GW !== '' ? Number(p2GW) : undefined

      const res = await fetch(`/api/pairings/${pairing.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, p1GameWins, p2GameWins, submittedBy: amP1 ? 'player1' : 'player2' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Screen><p className="text-slate-500">Loading...</p></Screen>
  if (error) return <Screen><p className="text-red-400">{error}</p></Screen>

  const myPairing = getMyPairing()
  const opponent = getOpponent(myPairing)
  const isBye = myPairing && !myPairing.player2_id
  const alreadySubmitted = myPairing && myPairing.result !== 'pending'
  const amP1 = myPairing && selectedPlayer && myPairing.player1_id === selectedPlayer.id

  const resultWinner = myPairing?.result === 'player1'
    ? players.find(p => p.id === myPairing.player1_id)
    : myPairing?.result === 'player2'
    ? players.find(p => p.id === myPairing.player2_id)
    : null

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/room/${code}`} className="text-slate-500 hover:text-slate-300 text-sm">← Room</Link>
          <h1 className="text-xl font-bold text-slate-100 mt-1">{tournament.name}</h1>
        </div>
        <div className="font-mono text-xl font-bold text-violet-400 tracking-widest">{code.toUpperCase()}</div>
      </div>

      {/* Select player */}
      {!selectedPlayer && (
        <div className="space-y-4">
          <p className="text-slate-300 font-medium">Who are you?</p>
          <div className="space-y-2">
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => selectPlayer(player)}
                className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-medium transition-colors"
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPlayer && (
        <div className="space-y-4">
          {/* Player identity */}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
            <div>
              <span className="text-xs text-slate-500">Playing as</span>
              <p className="text-slate-100 font-semibold">{selectedPlayer.name}</p>
            </div>
            <button
              onClick={() => { setSelectedPlayer(null); setSubmitted(false) }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Change
            </button>
          </div>

          {/* Timer */}
          {tournament.current_round > 0 && (
            <Timer
              timerStartedAt={tournament.timer_started_at}
              timerPausedAt={tournament.timer_paused_at}
              timerMinutes={tournament.timer_minutes}
              isTD={false}
            />
          )}

          {/* Waiting for round */}
          {tournament.current_round === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-2xl mb-2">⏳</p>
              <p>Waiting for Tournament Director to start Round 1...</p>
            </div>
          )}

          {/* Pairing */}
          {tournament.current_round > 0 && myPairing && (
            <div className="bg-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Round {tournament.current_round} — Table {myPairing.table_number}
                </span>
              </div>

              {isBye ? (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-emerald-400 font-semibold">You have a bye this round!</p>
                  <p className="text-slate-400 text-sm mt-1">+3 points awarded automatically</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-900 rounded-lg px-3 py-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">You</p>
                      <p className="text-slate-100 font-bold">{selectedPlayer.name}</p>
                    </div>
                    <span className="text-slate-500 font-bold">vs</span>
                    <div className="flex-1 bg-slate-900 rounded-lg px-3 py-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Opponent</p>
                      <p className="text-slate-100 font-bold">{opponent?.name || '—'}</p>
                    </div>
                  </div>

                  {/* Result already submitted */}
                  {(alreadySubmitted || submitted) && (
                    <div className="text-center py-2">
                      {myPairing.result === 'draw' ? (
                        <p className="text-slate-300 font-semibold">Result: Draw</p>
                      ) : resultWinner?.id === selectedPlayer.id ? (
                        <p className="text-emerald-400 font-bold text-lg">You won! 🏆</p>
                      ) : (
                        <p className="text-red-400 font-semibold">You lost</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">Result recorded</p>
                    </div>
                  )}

                  {/* Submit result */}
                  {!alreadySubmitted && !submitted && (
                    <div className="space-y-3">
                      {tournament.format === 'bo3' && (
                        <div>
                          <button
                            onClick={() => setShowGameScore(s => !s)}
                            className="text-xs text-violet-400 hover:text-violet-300 mb-2"
                          >
                            {showGameScore ? 'Hide game score' : '+ Enter game score (optional)'}
                          </button>
                          {showGameScore && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1 text-center">{selectedPlayer.name}</p>
                                <input
                                  type="number" min={0} max={2}
                                  value={amP1 ? p1GW : p2GW}
                                  onChange={e => amP1 ? setP1GW(e.target.value) : setP2GW(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:border-violet-500"
                                />
                              </div>
                              <span className="text-slate-500">-</span>
                              <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1 text-center">{opponent?.name}</p>
                                <input
                                  type="number" min={0} max={2}
                                  value={amP1 ? p2GW : p1GW}
                                  onChange={e => amP1 ? setP2GW(e.target.value) : setP1GW(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-slate-400 text-sm text-center">What was the result?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitResult(amP1 ? 'player1' : 'player2')}
                          disabled={submitting}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                          I Won
                        </button>
                        <button
                          onClick={() => submitResult('draw')}
                          disabled={submitting}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                          Draw
                        </button>
                        <button
                          onClick={() => submitResult(amP1 ? 'player2' : 'player1')}
                          disabled={submitting}
                          className="flex-1 bg-red-900 hover:bg-red-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                          I Lost
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tournament complete */}
          {tournament.status === 'complete' && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 text-center">
              <p className="text-emerald-300 font-bold">Tournament Complete!</p>
              <Link href={`/room/${code}/standings`} className="text-violet-400 text-sm mt-2 block">
                View Final Standings →
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function Screen({ children }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {children}
    </main>
  )
}
