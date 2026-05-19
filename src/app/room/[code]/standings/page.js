'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Standings from '@/components/Standings'
import Bracket from '@/components/Bracket'
import Timer from '@/components/Timer'
import { getStandings } from '@/lib/swiss'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import GameLogo from '@/components/GameLogo'

export default function StandingsPageWrapper() {
  return <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Loading...</p></main>}><StandingsPage /></Suspense>
}

function StandingsPage() {
  const { code } = useParams()
  const searchParams = useSearchParams()
  const castMode = searchParams.get('cast') === '1'
  const router = useRouter()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [pairings, setPairings] = useState([])
  const [showCastHelp, setShowCastHelp] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('standings')

  const fetchData = useCallback(async () => {
    const { data: t } = await supabase.from('tournaments').select('*').eq('code', code.toUpperCase()).single()
    if (!t) { setError('Tournament not found'); setLoading(false); return }
    const [{ data: p }, { data: pa }] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', t.id),
      supabase.from('pairings').select('*').eq('tournament_id', t.id),
    ])
    setTournament(t)
    setPlayers(p || [])
    setPairings(pa || [])
    setLoading(false)
  }, [code])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!tournament) return
    const ch = supabase
      .channel(`standings-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` },
        payload => setTournament(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('players').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPlayers(data || [])))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('pairings').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPairings(data || [])))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tournament?.id])

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Loading...</p></main>
  if (error) return <main className="min-h-screen flex flex-col items-center justify-center gap-3"><p className="text-red-400">{error}</p><Link href="/" className="text-violet-400">← Home</Link></main>

  const isKnockout = tournament.type !== 'swiss'
  const isSwiss = tournament.type === 'swiss'
  const pendingCount = pairings.filter(p => p.round === tournament.current_round && p.result === 'pending' && p.player2_id).length

  // TV / Cast mode
  if (castMode) {
    const standings = getStandings(players, pairings)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col px-8 py-6">
        <button
          onClick={() => { document.exitFullscreen?.(); router.push(`/room/${code}`) }}
          className="fixed top-3 left-3 z-50 bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-100 text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          ✕ Exit
        </button>
        {/* TV Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Left: tournament info + logo */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="hidden md:block shrink-0">
              <GameLogo game={tournament.game} className="h-16 w-40" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-100 truncate">{tournament.name}</h1>
              <p className="text-slate-500 text-base md:text-xl mt-0.5">{tournament.game} · {tournament.type.replace('_', ' ')}</p>
              <div className="text-slate-400 text-base md:text-xl mt-0.5">
                {tournament.status === 'complete'
                  ? 'Final Results'
                  : tournament.current_round === 0
                  ? 'Starting soon...'
                  : `Round ${tournament.current_round}${isSwiss ? ` / ${tournament.total_rounds}` : ''} · ${pendingCount > 0 ? `${pendingCount} pending` : 'All results in'}`}
              </div>
            </div>
          </div>

          {/* Right: timer + QR */}
          <div className="flex items-center gap-4 shrink-0">
            {tournament.current_round > 0 && tournament.status !== 'complete' && (
              <div className="w-48 md:w-72">
                <Timer
                  timerStartedAt={tournament.timer_started_at}
                  timerPausedAt={tournament.timer_paused_at}
                  timerMinutes={tournament.timer_minutes}
                  isTD={false}
                  large={true}
                  fillScreenAt={60}
                />
              </div>
            )}
            <div className="flex gap-3 md:gap-6 items-start">
              {tournament.current_round === 0 && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide">Players</p>
                  <QRCodeDisplay url={`${origin}/room/${code}/play`} code={code.toUpperCase()} hideCode small />
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide">Spectators</p>
                <QRCodeDisplay url={`${origin}/room/${code}/standings`} code={code.toUpperCase()} hideCode small />
              </div>
            </div>
          </div>
        </div>

        {/* Cast instructions toggle */}
        {!showCastHelp && (
          <button onClick={() => setShowCastHelp(true)} className="text-slate-600 hover:text-slate-400 text-xs mb-3 transition-colors">
            ? How to display on a TV
          </button>
        )}
        {showCastHelp && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-4 relative">
            <button onClick={() => setShowCastHelp(false)} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 text-sm">✕ Dismiss</button>
            <p className="text-slate-300 font-semibold mb-3">How to display on a TV or screen:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-slate-200 font-medium mb-1">Chrome (desktop)</p>
                <p className="text-slate-400">Menu (⋮) → Cast → select your Chromecast or display</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-slate-200 font-medium mb-1">Chrome (Android)</p>
                <p className="text-slate-400">Menu (⋮) → Cast → select your device</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-slate-200 font-medium mb-1">Safari (iPhone/iPad)</p>
                <p className="text-slate-400">Share → AirPlay · or mirror via Control Centre</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-slate-200 font-medium mb-1">Wired (any device)</p>
                <p className="text-slate-400">HDMI cable → press F11 or use browser fullscreen</p>
              </div>
            </div>
          </div>
        )}

        {/* Large standings table */}
        <div className="flex-1">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b-2 border-slate-700">
                <th className="pb-4 text-slate-500 text-2xl font-medium w-16">#</th>
                <th className="pb-4 text-slate-500 text-2xl font-medium">Player</th>
                <th className="pb-4 text-slate-500 text-2xl font-medium text-center">Pts</th>
                <th className="pb-4 text-slate-500 text-2xl font-medium text-center">W-L-D</th>
                {isSwiss && <th className="pb-4 text-slate-500 text-2xl font-medium text-center">OMW%</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {standings.map((player, idx) => (
                <tr key={player.id} className={idx === 0 && tournament.status === 'complete' ? 'bg-amber-900/20' : ''}>
                  <td className="py-4">
                    <span className={`text-3xl font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-4xl font-bold text-slate-100">{player.name}</span>
                    {idx === 0 && tournament.status === 'complete' && <span className="ml-3 text-3xl">🏆</span>}
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-4xl font-bold text-violet-400">{player.points}</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-3xl text-slate-400">{player.wins}-{player.losses}-{player.draws}</span>
                  </td>
                  {isSwiss && (
                    <td className="py-4 text-center">
                      <span className="text-2xl text-slate-500">{((player.omw || 0.33) * 100).toFixed(1)}%</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-700 text-sm text-center mt-4">Updates live · scan {code.toUpperCase()} to join</p>
      </main>
    )
  }

  // Normal mode
  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/room/${code}`} className="text-slate-500 hover:text-slate-300 text-sm">← Room</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">{tournament.type.replace('_', ' ')}</span>
            <span className="text-xs text-slate-500">{tournament.game}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="font-mono text-2xl font-bold text-violet-400 tracking-widest">{code.toUpperCase()}</div>
          {tournament.current_round > 0 && (
            <div className="text-sm text-slate-400">
              {tournament.status === 'complete' ? 'Final' : `Round ${tournament.current_round}${isSwiss ? ` / ${tournament.total_rounds}` : ''}`}
            </div>
          )}
          <a
            href={`/room/${code}/standings?cast=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            📺 TV View
          </a>
        </div>
      </div>

      {tournament.status === 'complete' ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-3 mb-6 text-center">
          <p className="text-emerald-300 font-bold">Tournament Complete · Final Results</p>
        </div>
      ) : tournament.current_round === 0 ? (
        <div className="bg-slate-800 rounded-xl p-3 mb-6 text-center">
          <p className="text-slate-400">Waiting for tournament to start...</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-3 mb-6 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Round {tournament.current_round} in progress</span>
          {pendingCount > 0
            ? <span className="text-amber-400 text-sm">{pendingCount} result{pendingCount !== 1 ? 's' : ''} pending</span>
            : <span className="text-emerald-400 text-sm">All results in</span>}
        </div>
      )}

      {isKnockout && (
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4">
          {['standings', 'bracket'].map(tab => (
            <button key={tab} onClick={() => setView(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${view === tab ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {view === 'standings' && (
        <div className="bg-slate-800 rounded-xl p-4">
          {players.length === 0
            ? <p className="text-slate-500 text-center py-4">No players yet</p>
            : <Standings players={players} pairings={pairings} showTiebreakers={isSwiss} />}
        </div>
      )}

      {view === 'bracket' && isKnockout && (
        <div className="bg-slate-800 rounded-xl p-4">
          <Bracket pairings={pairings} players={players} currentRound={tournament.current_round} />
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-8">Updates live via Supabase Realtime</p>
    </main>
  )
}
