'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getStandings } from '@/lib/swiss'
import Timer from '@/components/Timer'
import PairingCard from '@/components/PairingCard'
import Standings from '@/components/Standings'
import Bracket from '@/components/Bracket'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function RoomPage() {
  const { code } = useParams()
  const router = useRouter()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [pairings, setPairings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [advancing, setAdvancing] = useState(false)
  const [view, setView] = useState('pairings') // 'pairings' | 'standings' | 'bracket' | 'qr'
  const [isTD, setIsTD] = useState(false)
  const [joinPrompt, setJoinPrompt] = useState(false)
  const [advanceError, setAdvanceError] = useState('')

  const fetchData = useCallback(async () => {
    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (tErr || !t) {
      setError('Tournament not found')
      setLoading(false)
      return
    }

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

    // Check TD status
    const tdRooms = JSON.parse(localStorage.getItem('tcg_td_rooms') || '[]')
    if (tdRooms.includes(code.toUpperCase())) {
      setIsTD(true)
    } else {
      setJoinPrompt(true)
    }
  }, [code, fetchData])

  useEffect(() => {
    if (!tournament) return

    // Realtime subscriptions
    const tSub = supabase
      .channel(`tournament-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` },
        payload => setTournament(payload.new)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('players').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPlayers(data || []))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('pairings').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPairings(data || []))
      )
      .subscribe()

    return () => supabase.removeChannel(tSub)
  }, [tournament?.id])

  async function handleAdvanceRound() {
    setAdvancing(true)
    setAdvanceError('')
    try {
      const res = await fetch(`/api/tournaments/${code}/rounds`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.done) {
        await fetchData()
      }
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
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed to submit result')
    }
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

  const canAdvance = (tournament.status === 'waiting') || (allDone && !isComplete)
  const nextRoundLabel = tournament.current_round === 0
    ? 'Start Round 1'
    : isSwiss && tournament.current_round >= tournament.total_rounds
    ? 'Finish Tournament'
    : `Start Round ${tournament.current_round + 1}`

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <h1 className="text-xl font-bold text-slate-100 mt-1">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
              {tournament.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">{tournament.game}</span>
            {isTD && <span className="text-xs bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded-full">TD</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-violet-400 tracking-widest">{code.toUpperCase()}</div>
          {tournament.current_round > 0 && !isComplete && (
            <div className="text-sm text-slate-400 mt-0.5">
              Round {tournament.current_round}
              {isSwiss && ` / ${tournament.total_rounds}`}
            </div>
          )}
        </div>
      </div>

      {/* Non-TD join prompt */}
      {joinPrompt && !isTD && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-200 font-medium">You&apos;re viewing as a spectator</p>
            <p className="text-slate-400 text-sm">Join as a player to submit your results</p>
          </div>
          <Link
            href={`/room/${code}/play`}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Join as Player
          </Link>
        </div>
      )}

      {/* Complete banner */}
      {isComplete && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 mb-6 text-center">
          <p className="text-emerald-300 font-bold text-lg">Tournament Complete!</p>
          <p className="text-slate-400 text-sm mt-1">Final standings below</p>
        </div>
      )}

      {/* Timer */}
      {tournament.current_round > 0 && !isComplete && (
        <div className="mb-6">
          <Timer
            timerStartedAt={tournament.timer_started_at}
            timerPausedAt={tournament.timer_paused_at}
            timerMinutes={tournament.timer_minutes}
            isTD={isTD}
            onAction={handleTimerAction}
          />
        </div>
      )}

      {/* TD: Advance Round */}
      {isTD && !isComplete && (
        <div className="mb-6">
          <button
            onClick={handleAdvanceRound}
            disabled={!canAdvance || advancing}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {advancing ? 'Processing...' : nextRoundLabel}
          </button>
          {advanceError && <p className="text-red-400 text-sm mt-2 text-center">{advanceError}</p>}
          {!canAdvance && tournament.current_round > 0 && !isComplete && (
            <p className="text-slate-500 text-xs text-center mt-2">
              {pendingCount} result{pendingCount !== 1 ? 's' : ''} still pending
            </p>
          )}
        </div>
      )}

      {/* Share links */}
      <div className="flex gap-2 mb-6 text-sm">
        <Link
          href={`/room/${code}/play`}
          className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg border border-slate-700 transition-colors"
        >
          Player Link
        </Link>
        <Link
          href={`/room/${code}/standings`}
          className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg border border-slate-700 transition-colors"
        >
          Standings
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4">
        {['pairings', 'standings', isKnockout && 'bracket', 'qr'].filter(Boolean).map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              view === tab ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'qr' ? 'QR Code' : tab}
          </button>
        ))}
      </div>

      {/* Pairings view */}
      {view === 'pairings' && (
        <div className="space-y-3">
          {tournament.current_round === 0 ? (
            <p className="text-slate-500 text-center py-8">Start Round 1 to generate pairings</p>
          ) : currentRoundPairings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No pairings for this round</p>
          ) : (
            currentRoundPairings.map(p => (
              <PairingCard
                key={p.id}
                pairing={p}
                player1={playerMap[p.player1_id]}
                player2={p.player2_id ? playerMap[p.player2_id] : null}
                isTD={isTD}
                format={tournament.format}
                onSubmitResult={handleSubmitResult}
              />
            ))
          )}
        </div>
      )}

      {/* Standings view */}
      {view === 'standings' && (
        <div className="bg-slate-800 rounded-xl p-4">
          <Standings players={players} pairings={pairings} showTiebreakers={isSwiss} />
        </div>
      )}

      {/* Bracket view */}
      {view === 'bracket' && isKnockout && (
        <div className="bg-slate-800 rounded-xl p-4">
          <Bracket pairings={pairings} players={players} currentRound={tournament.current_round} />
        </div>
      )}

      {/* QR view */}
      {view === 'qr' && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div>
            <p className="text-slate-400 text-sm text-center mb-3">Players — scan to submit results</p>
            <QRCodeDisplay
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${code}/play`}
              code={code.toUpperCase()}
            />
          </div>
          <div>
            <p className="text-slate-400 text-sm text-center mb-3">Spectators — scan for live standings</p>
            <QRCodeDisplay
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${code}/standings`}
              code={code.toUpperCase()}
            />
          </div>
        </div>
      )}
    </main>
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
