'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  subscription_plan: 'free' | 'plus' | 'pro' | 'premium'
  subscription_status: string
  credits_remaining: number
  updated_at?: string
  force_refresh?: number
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshUser = useCallback(async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 [AUTH] Atualizando dados do usuário...')
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ [AUTH] Erro ao buscar usuário:', authError)
        setUser(null)
        return
      }

      if (!authUser) {
        console.log('⚠️ [AUTH] Usuário não autenticado')
        setUser(null)
        return
      }

      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        subscription_plan: authUser.user_metadata?.subscription_plan || 'free',
        subscription_status: authUser.user_metadata?.subscription_status || 'inactive',
        credits_remaining: authUser.user_metadata?.credits_remaining ?? 10,
        updated_at: authUser.user_metadata?.updated_at,
        force_refresh: authUser.user_metadata?.force_refresh
      }

      console.log('✅ [AUTH] Usuário atualizado:', {
        email: userProfile.email,
        plan: userProfile.subscription_plan,
        credits: userProfile.credits_remaining,
        updated_at: userProfile.updated_at
      })

      setUser(userProfile)
    } catch (error) {
      console.error('❌ [AUTH] Erro ao atualizar usuário:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Inicialização e listener de auth
  useEffect(() => {
    console.log('🚀 [AUTH] Inicializando useAuth...')
    
    // Carregar usuário inicial
    refreshUser().finally(() => setLoading(false))

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 [AUTH] Auth state changed: ${event}`)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      console.log('🛑 [AUTH] Removendo listener de auth')
      subscription.unsubscribe()
    }
  }, [refreshUser])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log(`🔐 [AUTH] Fazendo login: ${email}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ [AUTH] Erro no login:', error)
        throw error
      }

      console.log('✅ [AUTH] Login realizado com sucesso')
      return data
    } catch (error) {
      console.error('❌ [AUTH] Erro no signIn:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      console.log(`📝 [AUTH] Criando conta: ${email}`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_remaining: 10,
            created_at: new Date().toISOString()
          }
        }
      })

      if (error) {
        console.error('❌ [AUTH] Erro no cadastro:', error)
        throw error
      }

      console.log('✅ [AUTH] Cadastro realizado com sucesso')
      return data
    } catch (error) {
      console.error('❌ [AUTH] Erro no signUp:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 [AUTH] Fazendo logout...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ [AUTH] Erro no logout:', error)
        throw error
      }

      console.log('✅ [AUTH] Logout realizado com sucesso')
      setUser(null)
    } catch (error) {
      console.error('❌ [AUTH] Erro no signOut:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    isRefreshing,
    signIn,
    signUp,
    signOut,
    refreshUser
  }
} 