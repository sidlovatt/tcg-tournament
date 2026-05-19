'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Timer from '@/components/Timer'
import PairingCard from '@/components/PairingCard'
import Standings from '@/components/Standings'
import Bracket from '@/components/Bracket'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function RoomPage() {
  const { code } = useParams()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [pairings, setPairings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [advancing, setAdvancing] = useState(false)
  const [isTD, setIsTD] = useState(false)
  const [joinPrompt, setJoinPrompt] = useState(false)
  const [advanceError, setAdvanceError] = useState('')
  const [luckyLoserName, setLuckyLoserName] = useState('')

  const fetchData = useCallback(async () => {
    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (tErr || !t) { setError('Tournament not found'); setLoading(false); return }

    const [{ data: p }, { data: pa }] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', t.id),
      supabase.from('pairings').select('*').eq('tournament_id', t.id),
    ])

    setTournament(t)
    setPlayers(p || [])
    setPairings(pa || [])
    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchData()
    const tdRooms = JSON.parse(localStorage.getItem('tcg_td_rooms') || '[]')
    if (tdRooms.includes(code.toUpperCase())) setIsTD(true)
    else setJoinPrompt(true)
  }, [code, fetchData])

  useEffect(() => {
    if (!tournament) return
    const ch = supabase
      .channel(`tournament-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` },
        payload => setTournament(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('players').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPlayers(data || [])))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('pairings').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPairings(data || [])))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tournament?.id])

  async function handleAdvanceRound() {
    setAdvancing(true)
    setAdvanceError('')
    try {
      const res = await fetch(`/api/tournaments/${code}/rounds`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.done) await fetchData()
      if (data.luckyLoser) setLuckyLoserName(data.luckyLoser.name)
    } catch (err) {
      setAdvanceError(err.message)
    } finally {
      setAdvancing(false)
    }
  }

  async function handleTimerAction(action) {
    await fetch(`/api/tournaments/${code}/timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  async function handleSubmitResult(pairingId, result, p1GameWins, p2GameWins) {
    const res = await fetch(`/api/pairings/${pairingId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, p1GameWins, p2GameWins, submittedBy: 'td' }),
    })
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed') }
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  const currentRoundPairings = pairings.filter(p => p.round === tournament.current_round)
  const pendingCount = currentRoundPairings.filter(p => p.result === 'pending' && p.player2_id).length
  const allDone = pendingCount === 0 && currentRoundPairings.length > 0
  const isComplete = tournament.status === 'complete'
  const isSwiss = tournament.type === 'swiss'
  const isKnockout = tournament.type !== 'swiss'
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const canAdvance = tournament.status === 'waiting' || (allDone && !isComplete)
  const nextRoundLabel = tournament.current_round === 0
    ? 'Start Round 1'
    : isSwiss && tournament.current_round >= tournament.total_rounds
    ? 'Finish Tournament'
    : `Start Round ${tournament.current_round + 1}`

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <main className="min-h-screen px-4 py-4 w-full max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">{tournament.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                {tournament.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">{tournament.game} · {tournament.format.toUpperCase()}</span>
              {isTD && <span className="text-xs bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded-full">TD</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-3xl font-bold text-violet-400 tracking-widest">{code.toUpperCase()}</div>
            {tournament.current_round > 0 && !isComplete && (
              <div className="text-sm text-slate-400">
                Round {tournament.current_round}{isSwiss ? ` / ${tournament.total_rounds}` : ''}
              </div>
            )}
            {isComplete && <div className="text-sm text-emerald-400 font-semibold">Complete</div>}
          </div>
        </div>
      </div>


      {/* Non-TD join prompt */}
      {joinPrompt && !isTD && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-200 font-medium">Viewing as spectator</p>
            <p className="text-slate-400 text-sm">Join as a player to submit results</p>
          </div>
          <Link href={`/room/${code}/play`} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            Join as Player
          </Link>
        </div>
      )}

      {/* Lucky loser banner */}
      {luckyLoserName && (
        <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-amber-300 font-bold">🍀 Lucky Loser: <span className="text-white">{luckyLoserName}</span> has been drawn back into the tournament!</p>
          <button onClick={() => setLuckyLoserName('')} className="text-amber-600 hover:text-amber-400 text-sm ml-4">✕</button>
        </div>
      )}

      {/* Complete banner */}
      {isComplete && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-3 mb-4 text-center">
          <p className="text-emerald-300 font-bold text-lg">Tournament Complete · Final Standings</p>
        </div>
      )}

      {/* Main layout */}
      <div className={`grid grid-cols-1 gap-4 ${isComplete ? 'lg:grid-cols-[1fr_200px]' : 'lg:grid-cols-[1fr_240px_200px]'}`}>

        {/* COL 1: Pairings — hidden when complete */}
        {!isComplete && <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {tournament.current_round === 0 ? 'Pairings' : `Round ${tournament.current_round} Pairings`}
            </h2>
            {!isComplete && pendingCount > 0 && <span className="text-xs text-amber-400">{pendingCount} pending</span>}
            {!isComplete && allDone && currentRoundPairings.length > 0 && <span className="text-xs text-emerald-400">All results in</span>}
          </div>

          {tournament.current_round === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 font-medium mb-3">{players.length} Players Registered</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {players.map((p, i) => (
                  <div key={p.id} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-5">{i + 1}</span>
                    <span className="text-slate-200 text-sm font-medium truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentRoundPairings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No pairings</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {currentRoundPairings.map(p => (
                <PairingCard
                  key={p.id}
                  pairing={p}
                  player1={playerMap[p.player1_id]}
                  player2={p.player2_id ? playerMap[p.player2_id] : null}
                  isTD={isTD}
                  format={tournament.format}
                  onSubmitResult={handleSubmitResult}
                />
              ))}
            </div>
          )}

          {isKnockout && pairings.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4 mt-2">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Bracket</h2>
              <Bracket pairings={pairings} players={players} currentRound={tournament.current_round} />
            </div>
          )}
        </div>}

        {/* COL 2: Timer + Standings */}
        <div className="space-y-4">
          {tournament.current_round > 0 && !isComplete && (
            <Timer
              timerStartedAt={tournament.timer_started_at}
              timerPausedAt={tournament.timer_paused_at}
              timerMinutes={tournament.timer_minutes}
              isTD={isTD}
              onAction={handleTimerAction}
            />
          )}
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Standings</h2>
            <Standings players={players} pairings={pairings} showTiebreakers={isSwiss} />
          </div>
        </div>

        {/* COL 3: Controls + Join Links */}
        <div className="space-y-4">
          {isTD && !isComplete && (
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Controls</h2>
              <button
                onClick={handleAdvanceRound}
                disabled={!canAdvance || advancing}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {advancing ? 'Processing...' : nextRoundLabel}
              </button>
              {advanceError && <p className="text-red-400 text-xs text-center">{advanceError}</p>}
              {!canAdvance && tournament.current_round > 0 && (
                <p className="text-slate-500 text-xs text-center">
                  {pendingCount} result{pendingCount !== 1 ? 's' : ''} still pending
                </p>
              )}
              <a
                href={`/room/${code}/standings?cast=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2 rounded-lg transition-colors"
              >
                <CastIcon />
                TV View
              </a>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Join Links</h2>
            {tournament.current_round === 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">Players</p>
                <QRCodeDisplay url={`${origin}/room/${code}/play`} code={code.toUpperCase()} small />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">Spectators</p>
              <QRCodeDisplay url={`${origin}/room/${code}/standings`} code={code.toUpperCase()} small />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function CastIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2C12 15.07 7 10 1 10zm20-6H3c-1.1 0-2 .9-2 2v3h2V6h18v12h-6v2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
    </svg>
  )
}


function LoadingScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-slate-500">Loading tournament...</div>
    </main>
  )
}

function ErrorScreen({ message }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{message}</p>
      <Link href="/" className="text-violet-400 hover:text-violet-300">← Back to home</Link>
    </main>
  )
}
