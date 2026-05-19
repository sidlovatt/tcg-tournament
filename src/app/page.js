'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  function handleJoin(e) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }
    router.push(`/room/${code}`)
  }

  return (
    <main className="min-h-screen flex items-center px-6 py-12 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">

        {/* Left: branding + features */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-5 mb-3">
              <img src="/icons/icon.png" alt="TCG Tournament" className="w-48 h-48 rounded-2xl shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-slate-100 leading-tight">TCG Tournament Manager</h1>
                <p className="text-violet-400 text-lg mt-2 font-medium">Free. No account. No fuss.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-lg leading-relaxed">
            Run competitive TCG tournaments at home with your friends. Swiss pairings, live standings, knockout brackets, all from a single shareable room code.
          </p>

          <div className="space-y-4">
            {[
              { icon: <SwissIcon />, title: 'Swiss & Knockout', desc: 'Full Swiss with OMW% tiebreakers, single and double elimination brackets' },
              { icon: <QRIcon />, title: 'Players join by QR', desc: 'Players scan a code and submit results from their own device' },
              { icon: <CastIcon />, title: 'Cast to any screen', desc: 'Live standings and timer display for a TV or projector' },
              { icon: <TimerIcon />, title: 'Game-specific timers', desc: 'Preset round timers for Gundam, Magic, Pokémon, One Piece and more' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="bg-violet-900/40 border border-violet-800/50 rounded-lg p-2 shrink-0 text-violet-400 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold">{f.title}</p>
                  <p className="text-slate-500 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Get started</h2>
            <p className="text-slate-400 text-sm mt-1">Create a tournament or join an existing one</p>
          </div>

          <Link
            href="/create"
            className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 px-6 rounded-xl text-center text-lg transition-colors"
          >
            Create Tournament
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">or join existing</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Enter room code (e.g. AB3F7K)"
              value={roomCode}
              onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
              maxLength={6}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono text-slate-100 placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-violet-500"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Join Tournament
            </button>
          </form>

          <p className="text-slate-600 text-xs text-center">No account needed · rooms expire after 24 hours</p>
        </div>

      </div>
    </main>
  )
}

function SwissIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/>
      <rect x="3" y="15" width="6" height="6" rx="1"/>
      <path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
    </svg>
  )
}

function CastIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2C12 15.07 7 10 1 10zm20-6H3c-1.1 0-2 .9-2 2v3h2V6h18v12h-6v2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/>
      <path d="M9 3h6M12 3v2"/>
    </svg>
  )
}
