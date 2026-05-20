'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { GAME_PRESETS } from '@/lib/gamePresets'

const GAMES = GAME_PRESETS.filter(g => g.name !== 'Custom').map(g => g.name)
const RADII = [5, 10, 25, 50]

export default function CommunityPage() {
  const { user } = useAuth()
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState(10)
  const [game, setGame] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function search(e) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (postcode) params.set('postcode', postcode)
      params.set('radius', radius)
      if (game) params.set('game', game)
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Search failed'); setEvents([]); return }
      setEvents(data.events || [])
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { search() }, [])

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-2 block">← Home</Link>
          <h1 className="text-3xl font-bold text-slate-100">Community Tournaments</h1>
          <p className="text-slate-400 mt-1 text-sm">Find TCG events near you</p>
        </div>
        {user ? (
          <Link href="/community/create" className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm">
            + Host an Event
          </Link>
        ) : (
          <Link href="/signin" className="shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm">
            Sign in to host
          </Link>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={search} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-8 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Your postcode</label>
          <input
            type="text"
            value={postcode}
            onChange={e => setPostcode(e.target.value.toUpperCase())}
            placeholder="e.g. SW1A 1AA"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono tracking-wider"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Radius</label>
          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
          >
            {RADII.map(r => <option key={r} value={r}>{r} miles</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Game</label>
          <select
            value={game}
            onChange={e => setGame(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
          >
            <option value="">All games</option>
            {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
          Search
        </button>
      </form>

      {/* Results */}
      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
      {loading ? (
        <div className="text-center text-slate-500 py-20">Searching for events...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          <p className="text-lg font-semibold text-slate-400">No events found</p>
          <p className="text-sm mt-1">{postcode ? 'Try a wider radius or different game' : 'Enter your postcode to find events near you'}</p>
          {user && (
            <Link href="/community/create" className="inline-block mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm">
              Host the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </main>
  )
}

function EventCard({ event }) {
  const date = new Date(event.event_date)
  const regCount = event.event_registrations?.[0]?.count ?? 0

  return (
    <Link href={`/community/${event.id}`} className="block bg-slate-800/60 border border-slate-700 hover:border-violet-600/50 rounded-2xl p-5 transition-colors group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors">{event.title}</h3>
          <p className="text-violet-400 text-sm font-semibold">{event.game}{event.format ? ` · ${event.format}` : ''}</p>
        </div>
        {event.distanceMiles != null && (
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full shrink-0 whitespace-nowrap">{event.distanceMiles.toFixed(1)} mi</span>
        )}
      </div>
      <div className="space-y-1 text-sm text-slate-400">
        <p>📍 {event.venue_name}, {event.city}</p>
        <p>📅 {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        <p>👥 {regCount}{event.max_players ? ` / ${event.max_players}` : ''} registered</p>
      </div>
      {event.description && (
        <p className="text-slate-500 text-xs mt-3 line-clamp-2">{event.description}</p>
      )}
    </Link>
  )
}
