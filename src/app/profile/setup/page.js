'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

function SetupForm() {
  const { user, loading, setUsername: setCtxUsername } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/signin')
  }, [user, loading])

  function handleChange(e) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(val)
    setStatus(null)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val) return
    if (!/^[a-z0-9_]{3,20}$/.test(val)) { setStatus('invalid'); return }
    setStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check?username=${encodeURIComponent(val)}`)
        const { available } = await res.json()
        setStatus(available ? 'available' : 'taken')
      } catch {
        setStatus(null)
      }
    }, 400)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (status !== 'available' || !user) return
    setSubmitting(true)
    setError('')
    try {
      const clean = username.toLowerCase().trim()
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: clean }, { onConflict: 'id' })
      if (upsertError) {
        setError(upsertError.code === '23505' ? 'Username already taken' : upsertError.message)
        return
      }
      if (setCtxUsername) setCtxUsername(clean)
      router.replace(next)
    } catch (e) {
      setError(e?.message || 'Failed to set username')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading...</p>
    </main>
  )

  const statusColor = { available: 'text-emerald-400', taken: 'text-red-400', invalid: 'text-amber-400', checking: 'text-slate-500' }
  const statusMsg = { available: '✓ Available', taken: '✗ Already taken', invalid: '3–20 characters: letters, numbers, underscores', checking: 'Checking...' }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/icons/icon.png" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-100">Choose a username</h1>
          <p className="text-slate-400 text-sm mt-2">This is how you&apos;ll appear at events</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={handleChange}
                placeholder="yourname"
                maxLength={20}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
            {status && (
              <p className={`text-xs mt-1.5 ${statusColor[status]}`}>{statusMsg[status]}</p>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={status !== 'available' || submitting}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {submitting ? 'Saving...' : 'Set username'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Loading...</p></main>}>
      <SetupForm />
    </Suspense>
  )
}
