import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, hasValidSupabaseConfig } from '@/lib'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!hasValidSupabaseConfig) {
      console.warn('Supabase not configured. Running in development mode without authentication.')
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig) {
      toast.error('Authentication is not configured. Please set up Supabase credentials.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      toast.success('Check your email for verification link!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig) {
      toast.error('Authentication is not configured. Please set up Supabase credentials.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast.success('Successfully signed in!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!hasValidSupabaseConfig) {
      toast.error('Authentication is not configured. Please set up Supabase credentials.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        }
      })
      if (error) throw error
      // Don't show success message here as user will be redirected
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!hasValidSupabaseConfig) {
      toast.error('Authentication is not configured. Please set up Supabase credentials.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Successfully signed out!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
