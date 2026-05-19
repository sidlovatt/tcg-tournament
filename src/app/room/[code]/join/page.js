'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function JoinPage() {
  const { code } = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    const { data: t } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
    if (!t) { setError('Tournament not found'); setLoading(false); return }
    const { data: p } = await supabase.from('players').select('*').eq('tournament_id', t.id).order('created_at')
    setTournament(t)
    setPlayers(p || [])
    setLoading(false)
  }, [code])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!tournament) return
    const ch = supabase
      .channel(`join-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournament.id}` },
        payload => setTournament(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${tournament.id}` },
        () => supabase.from('players').select('*').eq('tournament_id', tournament.id).order('created_at').then(({ data }) => setPlayers(data || [])))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tournament?.id])

  async function handleJoin(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/tournaments/${code}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJoined(true)
      localStorage.setItem(`tcg_player_${code.toUpperCase()}`, data.player.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Screen><p className="text-slate-500">Loading...</p></Screen>
  if (error && !tournament) return <Screen><p className="text-red-400">{error}</p></Screen>

  if (tournament?.status !== 'waiting') {
    router.replace(`/room/${code}/play`)
    return <Screen><p className="text-slate-500">Redirecting...</p></Screen>
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-3">🃏</div>
          <h1 className="text-2xl font-bold text-slate-100">{tournament.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{tournament.game} · {tournament.type.replace('_', ' ')}</p>
          <div className="font-mono text-lg text-violet-400 tracking-widest mt-1">{code.toUpperCase()}</div>
        </div>

        {/* Player list */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Registered Players ({players.length})
          </p>
          {players.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-2">No players yet · be first!</p>
          ) : (
            <div className="space-y-1">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                  <span className="text-slate-200 text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join form */}
        {!joined ? (
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              maxLength={30}
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 text-center text-lg"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {submitting ? 'Joining...' : 'Join Tournament'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-3">
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4">
              <p className="text-emerald-300 font-bold text-lg">You&apos;re in! 🎉</p>
              <p className="text-slate-400 text-sm mt-1">Waiting for the TD to start...</p>
            </div>
            <p className="text-slate-600 text-xs">Keep this page open · the game will start soon</p>
          </div>
        )}

        {joined && tournament.status === 'active' && (
          <a
            href={`/room/${code}/play`}
            className="block w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Tournament started · Go to your match →
          </a>
        )}
      </div>
    </main>
  )
}

function Screen({ children }) {
  return <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">{children}</main>
}
