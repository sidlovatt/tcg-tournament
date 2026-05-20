'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function ProfilePage() {
  const { user, username, loading } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/signin')
  }, [loading, user])

  // Show skeleton until we know if user exists
  if (!user) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading...</p>
    </main>
  )

  const displayName = user.user_metadata?.full_name || user.email
  const avatar = user.user_metadata?.avatar_url

  async function copyEmail() {
    await navigator.clipboard.writeText(user.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="px-6 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-6 block">← Home</Link>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-7 space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="w-16 h-16 rounded-full border border-slate-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-2xl text-slate-400">
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="text-slate-100 font-bold text-lg">{displayName}</p>
            {username
              ? <p className="text-violet-400 font-semibold">@{username}</p>
              : <p className="text-amber-400 text-sm">No username set</p>
            }
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Email</p>
          <div className="flex items-center gap-2">
            <p className="text-slate-300 text-sm">{user.email}</p>
            <button onClick={copyEmail} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Provider */}
        <div className="space-y-1">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Signed in with</p>
          <p className="text-slate-300 text-sm capitalize">{user.app_metadata?.provider || 'OAuth'}</p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-700 space-y-3">
          {!username && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-4 py-3 text-amber-300 text-sm">
              Set a username to register for events and appear on leaderboards.
            </div>
          )}
          <Link href="/profile/setup" className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-center transition-colors text-sm">
            {username ? 'Change username' : 'Set username'}
          </Link>
          <Link href="/signout" className="block w-full bg-slate-700/50 hover:bg-slate-700 text-slate-400 font-semibold py-2.5 rounded-xl text-center transition-colors text-sm">
            Sign out
          </Link>
        </div>
      </div>
    </main>
  )
}
