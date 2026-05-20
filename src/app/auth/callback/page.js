'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

async function resolveAndRedirect(session, next, router) {
  if (!session?.user) { router.replace('/'); return }
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .maybeSingle()
  router.replace(profile?.username ? next : '/profile')
}

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    if (!code) { router.replace('/'); return }

    const timeout = setTimeout(async () => {
      // Fallback: check if session was established anyway
      const { data: { session } } = await supabase.auth.getSession()
      resolveAndRedirect(session, next, router)
    }, 8000)

    supabase.auth.exchangeCodeForSession(code)
      .then(async (result) => {
        clearTimeout(timeout)
        const session = result?.data?.session
        if (session?.user) {
          // Exchange succeeded
          resolveAndRedirect(session, next, router)
        } else {
          // Exchange returned null — code may have been auto-consumed
          const { data: { session: existing } } = await supabase.auth.getSession()
          resolveAndRedirect(existing, next, router)
        }
      })
      .catch(async () => {
        clearTimeout(timeout)
        const { data: { session } } = await supabase.auth.getSession()
        resolveAndRedirect(session, next, router)
      })
  }, [router, searchParams])

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
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Loading...</p></main>}>
      <CallbackHandler />
    </Suspense>
  )
}
