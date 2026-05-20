'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

const SETUP_EXEMPT = ['/profile', '/signin', '/privacy', '/terms']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [username, setUsername] = useState(null)
  const [usernameLoaded, setUsernameLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  async function fetchUsername(token) {
    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return null
      const { username } = await res.json()
      return username || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      const u = s?.user ?? null
      setUser(u)
      setSession(s ?? null)
      if (u && s?.access_token) {
        fetchUsername(s.access_token).then(name => {
          setUsername(name)
          setUsernameLoaded(true)
          setLoading(false)
        })
      } else {
        setUsernameLoaded(true)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setSession(session ?? null)
      if (u && session?.access_token) {
        const name = await fetchUsername(session.access_token)
        setUsername(name)
        setUsernameLoaded(true)
        setLoading(false)
        if (!name && !SETUP_EXEMPT.some(p => window.location.pathname.startsWith(p))) {
          router.replace('/profile')
        }
      } else {
        setUsername(null)
        setUsernameLoaded(true)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Belt-and-suspenders: catch cases where session loads but user has no username
  useEffect(() => {
    if (!loading && usernameLoaded && user && !username) {
      if (!SETUP_EXEMPT.some(p => pathname?.startsWith(p))) {
        router.replace('/profile')
      }
    }
  }, [loading, usernameLoaded, user, username, pathname])

  async function signIn(provider) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${base}/auth/callback` },
    })
  }

  async function signOut() {
    window.location.href = '/signout'
  }

  return (
    <AuthContext.Provider value={{ user, session, username, loading, signIn, signOut, setUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
