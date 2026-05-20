'use client'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { router.replace('/'); return }

    function finish(hasUser) {
      if (done.current) return
      done.current = true
      router.replace('/')
    }

    // Hard fallback — no Supabase dependency
    const timeout = setTimeout(() => finish(false), 15000)

    // Listen for SIGNED_IN — fires when exchange completes (either via us or auto-detect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        clearTimeout(timeout)
        finish(!!session?.user)
        subscription.unsubscribe()
      }
    })

    // Explicitly exchange the code — singleton client may not have auto-detected URL
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (!error && data?.session?.user) {
        clearTimeout(timeout)
        finish(true)
      }
      // If error, let onAuthStateChange or timeout handle it
    }).catch(() => {}) // onAuthStateChange or timeout handles fallback

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <img src="/icons/icon.png" alt="TCG Tournament" className="w-20 h-20 rounded-2xl animate-pulse" />
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-slate-400 text-sm">Signing in...</p>
        </div>
      </div>
    </main>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
