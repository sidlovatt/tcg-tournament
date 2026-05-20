'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'


export default function EventPage() {
  const { id } = useParams()
  const { user, username, session } = useAuth()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [myReg, setMyReg] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch(`/api/events/${id}`)
    const { event } = await res.json()
    setEvent(event)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (user && event?.event_registrations) {
      setMyReg(event.event_registrations.find(r => r.user_id === user.id) || null)
    }
  }, [user, event])

  async function register() {
    if (!user) { router.push('/signin'); return }
    setRegistering(true)
    setError('')
    try {

      const res = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ display_name: username || user.user_metadata?.full_name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to register'); return }
      setMyReg(data.registration)
    } catch {
      setError('Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  async function cancelRegistration() {
    setRegistering(true)
    try {

      await fetch(`/api/events/${id}/register`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      setMyReg(null)
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return <main className="px-6 py-8 max-w-3xl mx-auto"><p className="text-slate-500">Loading...</p></main>
  if (!event) return <main className="px-6 py-8 max-w-3xl mx-auto"><p className="text-slate-400">Event not found.</p></main>

  const date = new Date(event.event_date)
  const isHost = user?.id === event.user_id
  const registrations = event.event_registrations || []
  const approvedCount = registrations.filter(r => r.status !== 'rejected').length
  const full = event.max_players && approvedCount >= event.max_players

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto">
      <Link href="/community" className="text-slate-500 hover:text-slate-300 text-sm mb-6 block">← Community Tournaments</Link>

      {/* Header card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-7 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{event.title}</h1>
            <p className="text-violet-400 font-semibold">{event.game}{event.format ? ` · ${event.format}` : ''}</p>
          </div>
          {isHost && (
            <span className="text-xs bg-violet-900/40 text-violet-400 border border-violet-800/50 px-2 py-1 rounded-full shrink-0">Your event</span>
          )}
        </div>
        <div className="space-y-1.5 text-sm text-slate-400 mb-4">
          <p>📍 {event.venue_name}, {event.city} · {event.postcode}</p>
          <p>📅 {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>👥 {approvedCount}{event.max_players ? ` / ${event.max_players}` : ''} registered</p>
        </div>
        {event.description && (
          <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-700 pt-4 whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      {/* Registration action (non-hosts only) */}
      {!isHost && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
          {myReg ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${myReg.status === 'approved' ? 'bg-emerald-400' : myReg.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <p className="text-slate-200 font-semibold">
                  {myReg.status === 'approved' ? "You're registered!" : myReg.status === 'rejected' ? 'Registration declined' : 'Registration pending approval'}
                </p>
              </div>
              <button onClick={cancelRegistration} disabled={registering}
                className="text-slate-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50">
                Cancel registration
              </button>
            </div>
          ) : full ? (
            <p className="text-slate-400 text-center py-2">This event is full</p>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">{user ? 'Secure your spot at this event.' : 'Sign in to register for this event.'}</p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={register} disabled={registering}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
                {registering ? 'Registering...' : user ? 'Register for this event' : 'Sign in to register'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player list — host sees all, approved players see list */}
      {(isHost || myReg?.status === 'approved') && registrations.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h2 className="font-bold text-slate-200 mb-4">Registered Players ({approvedCount})</h2>
          <div className="space-y-2">
            {registrations
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map(r => (
                <div key={r.id} className="flex items-center justify-between py-1">
                  <p className="text-slate-300">{r.display_name || 'Anonymous'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    r.status === 'approved' ? 'bg-emerald-900/40 text-emerald-400' :
                    r.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                    'bg-amber-900/40 text-amber-400'
                  }`}>{r.status}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </main>
  )
}
