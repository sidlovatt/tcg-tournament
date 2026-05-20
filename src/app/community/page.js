'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { GAME_PRESETS } from '@/lib/gamePresets'

const GAMES = GAME_PRESETS.filter(g => g.name !== 'Custom').map(g => g.name)
const RADII = [5, 10, 25, 50]

export default function CommunityPage() {
  const { user } = useAuth()
  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [coords, setCoords] = useState(null) // { lat, lng } from geolocation or autocomplete
  const [geoLoading, setGeoLoading] = useState(false)
  const [radius, setRadius] = useState(10)
  const [game, setGame] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  function handleLocationInput(val) {
    setLocationQuery(val)
    setCoords(null)
    setSuggestions([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) return
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const results = await res.json()
        setSuggestions(results)
      } catch {}
      setSearching(false)
    }, 350)
  }

  function selectSuggestion(s) {
    setLocationQuery(s.display_name)
    setCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) })
    setSuggestions([])
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser'); return }
    setGeoLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationQuery('My location')
        setSuggestions([])
        setGeoLoading(false)
      },
      () => {
        setError('Could not get your location')
        setGeoLoading(false)
      },
      { timeout: 10000 }
    )
  }

  async function search(e) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    setSearched(true)
    setSuggestions([])
    try {
      const params = new URLSearchParams()
      if (coords) {
        params.set('lat', coords.lat)
        params.set('lng', coords.lng)
      } else if (locationQuery.trim()) {
        params.set('location', locationQuery.trim())
      }
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
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">Location</label>
          <div className="relative">
            <input
              type="text"
              value={locationQuery}
              onChange={e => handleLocationInput(e.target.value)}
              placeholder="City, venue, or postcode..."
              autoComplete="off"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-xl">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0">
                      <span className="font-semibold">{s.name || s.display_name.split(',')[0]}</span>
                      <span className="text-slate-500 text-xs block truncate">{s.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          title="Use my location"
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm flex items-center gap-2 shrink-0"
        >
          {geoLoading ? (
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          )}
          <span className="hidden sm:inline">My location</span>
        </button>
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
          <p className="text-sm mt-1">{locationQuery ? 'Try a wider radius or different game' : 'Enter a location or use My Location to find events near you'}</p>
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
