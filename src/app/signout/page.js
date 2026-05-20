'use client'
import { useEffect } from 'react'

export default function SignOut() {
  useEffect(() => {
    // Clear all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key)
    })
    // Also try the Supabase client
    try {
      const { createClient } = require('@supabase/supabase-js')
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      client.auth.signOut().catch(() => {})
    } catch {}
    window.location.replace('/')
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Signing out...</p>
    </main>
  )
}
