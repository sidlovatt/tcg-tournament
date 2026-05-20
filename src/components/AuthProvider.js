'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

const SETUP_EXEMPT = ['/profile/setup', '/auth/callback', '/signin', '/privacy', '/terms']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(null)
  const [usernameLoaded, setUsernameLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  async function fetchUsername(userId) {
    const { data } = await supabase.from('profiles').select('username').eq('id', userId).single()
    setUsername(data?.username || null)
    setUsernameLoaded(true)
    return data?.username || null
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchUsername(u.id)
      else { setUsernameLoaded(true); setLoading(false) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const name = await fetchUsername(u.id)
        setLoading(false)
        if (!name && !SETUP_EXEMPT.some(p => window.location.pathname.startsWith(p))) {
          router.replace('/profile/setup')
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
        router.replace('/profile/setup')
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
    <AuthContext.Provider value={{ user, username, loading, signIn, signOut, setUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
