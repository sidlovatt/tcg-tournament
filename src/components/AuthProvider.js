'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchUsername(userId) {
    const { data } = await supabase.from('profiles').select('username').eq('id', userId).single()
    setUsername(data?.username || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchUsername(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchUsername(u.id)
      else setUsername(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUsername(null)
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
