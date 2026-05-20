'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  function handleJoin(e) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }
    router.push(`/room/${code}/join`)
  }

  return (
    <main className="px-6 py-12 max-w-6xl mx-auto">
      {/* Auth bar */}
      <div className="flex justify-end mb-8">
        {user ? (
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-slate-400 text-sm">{user.user_metadata?.full_name || user.email}</span>
            <button onClick={signOut} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Sign out</button>
          </div>
        ) : (
          <Link href="/signin" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Sign in</Link>
        )}
      </div>

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <img src="/icons/icon.png" alt="TCG Tournament" className="w-36 h-36 rounded-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">TCG Tournament Manager</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Run competitive TCG tournaments with Swiss pairings, live standings, and knockout brackets — from a single shareable room code.
        </p>
      </div>

      {/* Two paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-3xl mx-auto">

        {/* Quick Tournament */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <span className="text-violet-400 font-bold text-lg">⚡ Quick Tournament</span>
            <p className="text-slate-400 text-sm mt-1">Create a room, share the code, start playing. No account needed.</p>
          </div>
          <div className="space-y-2 flex-1">
            {['Swiss & knockout brackets', 'Players join by QR code', 'Live standings on any screen', 'Game-specific round timers'].map(f => (
              <p key={f} className="text-slate-400 text-sm flex items-center gap-2">
                <span className="text-violet-500">✓</span> {f}
              </p>
            ))}
          </div>
          <div className="space-y-3">
            <Link href="/create" className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-xl text-center transition-colors">
              Create Tournament
            </Link>
            <form onSubmit={handleJoin} className="space-y-2">
              <input
                type="text"
                placeholder="Have a room code? Enter it here"
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                maxLength={6}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-mono text-slate-100 placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:border-violet-500"
              />
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Join by Room Code
              </button>
            </form>
            <p className="text-slate-600 text-xs text-center">No account needed</p>
          </div>
        </div>

        {/* Create or Find — sign in */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-bold text-lg">🗓 Community Tournaments</span>
              <span className="text-xs bg-amber-900/40 text-amber-500 border border-amber-800/50 px-2 py-0.5 rounded-full">Coming soon</span>
            </div>
            <p className="text-slate-500 text-sm">Plan events in advance, open registration, and find tournaments near you.</p>
          </div>
          <div className="space-y-2 flex-1">
            {[
              'Schedule & list public events',
              'Player registration & applications',
              'Find tournaments near you',
              'Search by game, venue & date',
            ].map(f => (
              <p key={f} className="text-slate-600 text-sm flex items-center gap-2">
                <span className="text-slate-700">✓</span> {f}
              </p>
            ))}
          </div>
          <div className="space-y-3">
            {user ? (
              <div className="w-full bg-slate-700/40 text-slate-600 font-semibold py-3 px-4 rounded-xl text-center text-sm cursor-not-allowed">Coming soon</div>
            ) : (
              <Link href="/signin" className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-xl text-center transition-colors">
                Sign in for early access
              </Link>
            )}
            <p className="text-slate-600 text-xs text-center">Free account · Google or Discord</p>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100">See it in action</h2>
          <p className="text-slate-500 text-sm mt-1">What you and your players actually see</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mockup 1: TD room view */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider text-center font-semibold">Tournament Director</p>
            <BrowserFrame>
              <TDMockup />
            </BrowserFrame>
          </div>

          {/* Mockup 2: Player phone view (centre) */}
          <div className="space-y-2 flex flex-col items-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider text-center font-semibold">Player&apos;s Phone</p>
            <PhoneFrame>
              <PlayerMockup />
            </PhoneFrame>
          </div>

          {/* Mockup 3: Cast / TV view */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider text-center font-semibold">Cast to TV</p>
            <BrowserFrame>
              <CastMockup />
            </BrowserFrame>
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <p>© {new Date().getFullYear()} TCG Tournament Manager</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
        </div>
      </footer>
    </main>
  )
}

function BrowserFrame({ children, dark = false }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 bg-slate-700 rounded-md px-3 py-0.5 mx-2">
          <p className="text-slate-500 text-xs truncate">tcg-tournament.vercel.app</p>
        </div>
      </div>
      <div className={dark ? 'bg-slate-950' : 'bg-slate-900'}>
        {children}
      </div>
    </div>
  )
}

function PhoneFrame({ children }) {
  return (
    <div className="mx-auto w-48 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl">
      <div className="bg-slate-800 h-6 flex items-center justify-center">
        <div className="w-12 h-1 bg-slate-600 rounded-full" />
      </div>
      <div className="bg-slate-900">
        {children}
      </div>
      <div className="bg-slate-800 h-5 flex items-center justify-center">
        <div className="w-8 h-1 bg-slate-600 rounded-full" />
      </div>
    </div>
  )
}

function TDMockup() {
  const pairings = [
    { table: 1, p1: 'Alex', p2: 'Sam', done: true, winner: 'Alex' },
    { table: 2, p1: 'Jordan', p2: 'Riley', done: false },
    { table: 3, p1: 'Morgan', p2: 'Casey', done: false },
    { table: 4, p1: 'Drew', p2: 'Quinn', done: true, winner: 'Quinn' },
  ]
  const standings = [
    { name: 'Alex', pts: 6, w: 2, l: 0 },
    { name: 'Quinn', pts: 6, w: 2, l: 0 },
    { name: 'Jordan', pts: 3, w: 1, l: 1 },
    { name: 'Sam', pts: 3, w: 1, l: 1 },
  ]
  return (
    <div className="p-2 text-[9px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
        <div>
          <p className="text-slate-100 font-bold text-[10px]">Friday Night Pokémon</p>
          <p className="text-slate-500">Swiss · BO1 · Round 2/4</p>
        </div>
        <p className="text-violet-400 font-mono font-bold text-[10px]">K9X2MV</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Pairings */}
        <div className="space-y-1">
          <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Pairings</p>
          {pairings.map(p => (
            <div key={p.table} className={`rounded-lg p-1.5 border ${p.done ? 'border-slate-700 opacity-70' : 'border-slate-600'} bg-slate-800`}>
              <p className="text-slate-500 mb-0.5">Table {p.table}</p>
              <div className="flex items-center gap-1">
                <span className={`flex-1 text-center rounded px-1 py-0.5 ${p.done && p.winner === p.p1 ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-200'}`}>{p.p1}</span>
                <span className="text-slate-600">v</span>
                <span className={`flex-1 text-center rounded px-1 py-0.5 ${p.done && p.winner === p.p2 ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-200'}`}>{p.p2}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Standings */}
        <div>
          <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Standings</p>
          <div className="bg-slate-800 rounded-lg p-1.5 space-y-1">
            {standings.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1">
                <span className={`w-3 font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-600'}`}>{i + 1}</span>
                <span className="flex-1 text-slate-200">{s.name}</span>
                <span className="text-violet-400 font-bold">{s.pts}</span>
                <span className="text-slate-600">{s.w}-{s.l}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-800 rounded-lg p-1.5 mt-1 text-center">
            <p className="text-slate-500">ROUND TIMER</p>
            <p className="text-emerald-400 font-mono font-bold text-base">28:14</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CastMockup() {
  const standings = [
    { name: 'Alex', pts: 6, w: 2, l: 0, omw: '62.5%' },
    { name: 'Quinn', pts: 6, w: 2, l: 0, omw: '58.3%' },
    { name: 'Jordan', pts: 3, w: 1, l: 1, omw: '66.7%' },
    { name: 'Sam', pts: 3, w: 1, l: 1, omw: '58.3%' },
    { name: 'Morgan', pts: 3, w: 1, l: 1, omw: '50.0%' },
    { name: 'Casey', pts: 0, w: 0, l: 2, omw: '66.7%' },
  ]
  return (
    <div className="p-3 text-[9px]">
      {/* Cast header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div>
          <p className="text-slate-100 font-bold text-sm">Friday Night Pokémon</p>
          <p className="text-slate-500 text-[9px]">Pokémon TCG · swiss · Round 2/4</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-1.5 text-center min-w-[60px]">
          <p className="text-slate-500 text-[7px] uppercase">Timer</p>
          <p className="text-emerald-400 font-mono font-bold text-sm">28:14</p>
        </div>
      </div>
      {/* Standings table */}
      <table className="w-full">
        <thead>
          <tr className="text-slate-600 border-b border-slate-800">
            <th className="text-left pb-1 w-4">#</th>
            <th className="text-left pb-1">Player</th>
            <th className="text-center pb-1">Pts</th>
            <th className="text-center pb-1">W-L</th>
            <th className="text-center pb-1">OMW%</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.name} className="border-b border-slate-900">
              <td className={`py-1 font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-600'}`}>{i + 1}</td>
              <td className="py-1 text-slate-100 font-semibold">{s.name}</td>
              <td className="py-1 text-center text-violet-400 font-bold">{s.pts}</td>
              <td className="py-1 text-center text-slate-400">{s.w}-{s.l}</td>
              <td className="py-1 text-center text-slate-500">{s.omw}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-slate-700 text-[7px] text-center mt-2">Updates live · scan K9X2MV to spectate</p>
    </div>
  )
}

function PlayerMockup() {
  return (
    <div className="p-3 text-[9px] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-[7px]">← Room</p>
          <p className="text-slate-100 font-bold text-[10px]">Friday Night Pokémon</p>
        </div>
        <p className="text-violet-400 font-mono font-bold text-[9px]">K9X2MV</p>
      </div>
      {/* Playing as */}
      <div className="bg-slate-800 rounded-lg px-2 py-1.5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-[7px]">Playing as</p>
          <p className="text-slate-100 font-semibold">Alex</p>
        </div>
        <p className="text-slate-600 text-[7px]">Change</p>
      </div>
      {/* Timer */}
      <div className="bg-slate-800 rounded-lg p-2 text-center">
        <p className="text-slate-500 text-[7px] uppercase tracking-wider">Round Timer</p>
        <p className="text-emerald-400 font-mono font-bold text-xl">28:14</p>
      </div>
      {/* Matchup */}
      <div className="bg-slate-800 rounded-lg p-2 space-y-2">
        <p className="text-slate-500 text-[7px] uppercase tracking-wider">Round 2 · Table 3</p>
        <div className="flex items-center gap-1">
          <div className="flex-1 bg-slate-900 rounded px-1 py-1.5 text-center">
            <p className="text-slate-500 text-[7px]">You</p>
            <p className="text-slate-100 font-bold text-[10px]">Alex</p>
          </div>
          <p className="text-slate-600 font-bold">vs</p>
          <div className="flex-1 bg-slate-900 rounded px-1 py-1.5 text-center">
            <p className="text-slate-500 text-[7px]">Opponent</p>
            <p className="text-slate-100 font-bold text-[10px]">Jordan</p>
          </div>
        </div>
        <p className="text-slate-400 text-[8px] text-center">What was the result?</p>
        <div className="flex gap-1">
          <div className="flex-1 bg-emerald-700 rounded-lg py-1.5 text-center text-white font-semibold text-[8px]">I Won</div>
          <div className="bg-slate-700 rounded-lg px-1.5 py-1.5 text-center text-slate-300 text-[8px]">Draw</div>
          <div className="flex-1 bg-red-900 rounded-lg py-1.5 text-center text-white font-semibold text-[8px]">I Lost</div>
        </div>
      </div>
    </div>
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
