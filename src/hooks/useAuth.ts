'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  subscription_plan: 'free' | 'plus' | 'pro' | 'premium' | 'super'
  subscription_status: string
  credits_remaining: number
  updated_at?: string
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para converter dados do usuário
  const convertUserData = useCallback((authUser: User): UserProfile => {
    const metadata = authUser.user_metadata || {}
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      subscription_plan: metadata.subscription_plan || 'free',
      subscription_status: metadata.subscription_status || 'active',
      credits_remaining: metadata.credits_remaining || 0,
      updated_at: authUser.updated_at
    }
  }, [])

  // Função para buscar dados do usuário
  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ [AUTH] Erro ao buscar usuário:', error)
        setUser(null)
        return
      }

      if (authUser) {
        const userData = convertUserData(authUser)
        console.log('✅ [AUTH] Usuário carregado:', userData)
        setUser(userData)
      } else {
        console.log('ℹ️ [AUTH] Nenhum usuário logado')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ [AUTH] Erro inesperado:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [convertUserData])

  // Função de login
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ [AUTH] Erro no login:', error)
        throw error
      }

      if (data.user) {
        const userData = convertUserData(data.user)
        setUser(userData)
        console.log('✅ [AUTH] Login realizado:', userData)
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ [AUTH] Erro no signIn:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [convertUserData])

  // Função de registro
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_remaining: 10
          }
        }
      })

      if (error) {
        console.error('❌ [AUTH] Erro no registro:', error)
        throw error
      }

      console.log('✅ [AUTH] Registro realizado:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ [AUTH] Erro no signUp:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  // Função de logout
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ [AUTH] Erro no logout:', error)
        throw error
      }

      setUser(null)
      console.log('✅ [AUTH] Logout realizado')
    } catch (error) {
      console.error('❌ [AUTH] Erro no signOut:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Função para atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    console.log('🔄 [AUTH] Atualizando dados do usuário...')
    await fetchUser()
  }, [fetchUser])

  // Inicialização e listener de mudanças de auth
  useEffect(() => {
    console.log('🚀 [AUTH] Inicializando hook useAuth')
    
    // Buscar usuário inicial
    fetchUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AUTH] Evento: ${event}`, session?.user?.email || 'sem usuário')
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = convertUserData(session.user)
          setUser(userData)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userData = convertUserData(session.user)
          setUser(userData)
        }
      }
    )

    return () => {
      console.log('🧹 [AUTH] Limpando listeners')
      subscription.unsubscribe()
    }
  }, [fetchUser, convertUserData])

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }
} 