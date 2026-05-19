'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Standings from '@/components/Standings'
import Bracket from '@/components/Bracket'

export default function StandingsPage() {
  const { code } = useParams()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [pairings, setPairings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('standings')

  const fetchData = useCallback(async () => {
    const { data: t } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

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
        payload => setTournament(payload.new)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('players').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPlayers(data || []))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('pairings').select('*').eq('tournament_id', tournament.id).then(({ data }) => setPairings(data || []))
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tournament?.id])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Loading standings...</p>
    </main>
  )

  if (error) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3">
      <p className="text-red-400">{error}</p>
      <Link href="/" className="text-violet-400 hover:text-violet-300">← Home</Link>
    </main>
  )

  const isKnockout = tournament.type !== 'swiss'
  const isSwiss = tournament.type === 'swiss'
  const pendingCount = pairings.filter(
    p => p.round === tournament.current_round && p.result === 'pending' && p.player2_id
  ).length

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/room/${code}`} className="text-slate-500 hover:text-slate-300 text-sm">← Room</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
              {tournament.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">{tournament.game}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-violet-400 tracking-widest">{code.toUpperCase()}</div>
          {tournament.current_round > 0 && (
            <div className="text-sm text-slate-400 mt-0.5">
              {tournament.status === 'complete' ? 'Final' : `Round ${tournament.current_round}${isSwiss ? ` / ${tournament.total_rounds}` : ''}`}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      {tournament.status === 'complete' ? (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-3 mb-6 text-center">
          <p className="text-emerald-300 font-bold">Tournament Complete — Final Results</p>
        </div>
      ) : tournament.current_round === 0 ? (
        <div className="bg-slate-800 rounded-xl p-3 mb-6 text-center">
          <p className="text-slate-400">Waiting for tournament to start...</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-3 mb-6 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Round {tournament.current_round} in progress</span>
          {pendingCount > 0 ? (
            <span className="text-amber-400 text-sm">{pendingCount} result{pendingCount !== 1 ? 's' : ''} pending</span>
          ) : (
            <span className="text-emerald-400 text-sm">All results in</span>
          )}
        </div>
      )}

      {/* Tabs */}
      {isKnockout && (
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4">
          {['standings', 'bracket'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                view === tab ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Standings */}
      {view === 'standings' && (
        <div className="bg-slate-800 rounded-xl p-4">
          {players.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No players yet</p>
          ) : (
            <Standings players={players} pairings={pairings} showTiebreakers={isSwiss} />
          )}
        </div>
      )}

      {/* Bracket */}
      {view === 'bracket' && isKnockout && (
        <div className="bg-slate-800 rounded-xl p-4">
          <Bracket pairings={pairings} players={players} currentRound={tournament.current_round} />
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-8">Updates live via Supabase Realtime</p>
    </main>
  )
}
