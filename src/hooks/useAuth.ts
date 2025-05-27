'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth, users, supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await users.getProfile(userId)
      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }
      setUserProfile(data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  // Atualizar perfil
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  // Fazer login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        return { error }
      }

      if (data.user) {
        await loadUserProfile(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Registrar usuário
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)
      const { data, error } = await auth.signUp(email, password, name)
      
      if (error) {
        return { error }
      }

      // Se o usuário foi criado, criar perfil
      if (data.user) {
        await users.createProfile(data.user.id, {
          email,
          name: name || '',
          subscription_plan: 'free',
          subscription_status: 'active',
          credits_remaining: 10,
        })
        await loadUserProfile(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Fazer logout
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await auth.signOut()
      
      if (!error) {
        setUser(null)
        setSession(null)
        setUserProfile(null)
      }

      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Monitorar mudanças de autenticação
  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { session } = await auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
} 