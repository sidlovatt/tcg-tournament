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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-4xl font-bold text-slate-100">TCG Tournament</h1>
          <p className="text-slate-400">Run Swiss or Knockout tournaments at home</p>
        </div>

        {/* Create */}
        <Link
          href="/create"
          className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 px-6 rounded-xl text-center text-lg transition-colors"
        >
          Create Tournament
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-sm">or join existing</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Join */}
        <form onSubmit={handleJoin} className="space-y-3">
          <input
            type="text"
            placeholder="Enter room code (e.g. AB3F7K)"
            value={roomCode}
            onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
            maxLength={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono text-slate-100 placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-violet-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Join Tournament
          </button>
        </form>
      </div>
    </main>
  )
}
