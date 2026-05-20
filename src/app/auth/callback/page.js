'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function AuthCallback() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => { window.location.href = '/' }, 15000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (loading) return
    router.replace(user ? '/profile' : '/')
  }, [loading, user])

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
