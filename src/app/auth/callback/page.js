'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data: { session } }) => {
        if (!session?.user) { router.replace('/'); return }
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()

        if (!profile?.username) {
          const setupNext = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
          router.replace(`/profile/setup${setupNext}`)
        } else {
          router.replace(next)
        }
      }).catch(() => {
        router.replace('/?auth_error=1')
      })
    } else {
      router.replace('/')
    }
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Signing in...</p>
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
