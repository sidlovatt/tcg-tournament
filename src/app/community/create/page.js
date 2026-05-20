'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { GAME_PRESETS } from '@/lib/gamePresets'

const GAMES = GAME_PRESETS.filter(g => g.name !== 'Custom').map(g => g.name)

export default function CreateEventPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [locationSet, setLocationSet] = useState(false)
  const debounceRef = useRef(null)
  const [form, setForm] = useState({
    title: '', game: '', format: '', description: '',
    venue_name: '', city: '', postcode: '',
    event_date: '', event_time: '10:00', max_players: '', is_public: true,
  })

  useEffect(() => {
    if (!loading && !user) router.replace('/signin')
  }, [user, loading])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleAddressInput(val) {
    setAddressQuery(val)
    setLocationSet(false)
    setSuggestions([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) return
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&countrycodes=gb&format=json&addressdetails=1&limit=6`,
          { headers: { 'Accept-Language': 'en-GB' } }
        )
        const results = await res.json()
        setSuggestions(results)
      } catch {}
      setSearching(false)
    }, 350)
  }

  function selectSuggestion(s) {
    const addr = s.address || {}
    const city = addr.city || addr.town || addr.village || addr.county || ''
    const postcode = addr.postcode || ''
    const venueName = s.name || addr.road || ''
    setForm(f => ({ ...f, venue_name: venueName, city, postcode }))
    setAddressQuery(s.display_name)
    setSuggestions([])
    setLocationSet(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const eventDate = new Date(`${form.event_date}T${form.event_time}:00`)
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          ...form,
          event_date: eventDate.toISOString(),
          max_players: form.max_players ? parseInt(form.max_players) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create event'); return }
      router.push(`/community/${data.id}`)
    } catch {
      setError('Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) return null

  return (
    <main className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/community" className="text-slate-500 hover:text-slate-300 text-sm mb-6 block">← Community Tournaments</Link>
      <h1 className="text-3xl font-bold text-slate-100 mb-8">Host an Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event details */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-200">Event Details</h2>
          <Field label="Event title" required>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
              placeholder="Friday Night Pokémon" required className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Game" required>
              <select value={form.game} onChange={e => update('game', e.target.value)} required className={inputCls}>
                <option value="">Select game</option>
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Format">
              <input type="text" value={form.format} onChange={e => update('format', e.target.value)}
                placeholder="e.g. Standard, Limited" className={inputCls} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} placeholder="Entry fee, prizes, any other info..."
              className={`${inputCls} resize-none`} />
          </Field>
        </section>

        {/* Location */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-200">Location</h2>
          <Field label="Search address" required>
            <div className="relative">
              <input
                type="text"
                value={addressQuery}
                onChange={e => handleAddressInput(e.target.value)}
                placeholder="Start typing a venue or address..."
                autoComplete="off"
                className={inputCls}
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
                        className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0">
                        <span className="font-semibold">{s.name || s.display_name.split(',')[0]}</span>
                        <span className="text-slate-500 text-xs block truncate">{s.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {locationSet && <p className="text-emerald-400 text-xs mt-1">✓ Location set — edit fields below if needed</p>}
          </Field>

          {locationSet && (
            <>
              <Field label="Venue name" required>
                <input type="text" value={form.venue_name} onChange={e => update('venue_name', e.target.value)}
                  placeholder="The Game Store" required className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required>
                  <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                    placeholder="London" required className={inputCls} />
                </Field>
                <Field label="Postcode" required>
                  <input type="text" value={form.postcode} onChange={e => update('postcode', e.target.value.toUpperCase())}
                    placeholder="SW1A 1AA" required className={`${inputCls} font-mono tracking-wider`} />
                </Field>
              </div>
            </>
          )}
        </section>

        {/* Date & time */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-slate-200">Date & Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <input type="date" value={form.event_date} onChange={e => update('event_date', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0] })()}
                className={inputCls} />
            </Field>
            <Field label="Start time" required>
              <input type="time" value={form.event_time} onChange={e => update('event_time', e.target.value)}
                required className={inputCls} />
            </Field>
          </div>
          <Field label="Max players">
            <input type="number" value={form.max_players} onChange={e => update('max_players', e.target.value)}
              placeholder="Leave blank for unlimited" min={2} className={inputCls} />
          </Field>
        </section>

        {/* Visibility */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => update('is_public', e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500" />
            <div>
              <p className="font-semibold text-slate-200">Public event</p>
              <p className="text-slate-500 text-sm">Anyone can find and register for this event</p>
            </div>
          </label>
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors">
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </main>
  )
}

const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">
        {label}{required && <span className="text-violet-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
