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
  const [lastRefresh, setLastRefresh] = useState<number>(0)

  const refreshUser = useCallback(async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 [AUTH] Atualizando dados do usuário...')
      
      // Forçar refresh do token para pegar dados atualizados
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      
      if (sessionError) {
        console.error('❌ [AUTH] Erro ao atualizar sessão:', sessionError)
        return
      }

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
    
    let mounted = true
    
    // Função para carregar usuário inicial
    const loadInitialUser = async () => {
      try {
        console.log('🔄 [AUTH] Carregando usuário inicial...')
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (authError) {
          console.error('❌ [AUTH] Erro ao buscar usuário:', authError)
          setUser(null)
          setLoading(false)
          return
        }

        if (!authUser) {
          console.log('⚠️ [AUTH] Usuário não autenticado')
          setUser(null)
          setLoading(false)
          return
        }

        console.log('✅ [AUTH] Usuário encontrado:', authUser.email)
        
        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          subscription_plan: authUser.user_metadata?.subscription_plan || 'free',
          subscription_status: authUser.user_metadata?.subscription_status || 'inactive',
          credits_remaining: authUser.user_metadata?.credits_remaining ?? 10,
          updated_at: authUser.user_metadata?.updated_at,
          force_refresh: authUser.user_metadata?.force_refresh
        }
        
        setUser(userProfile)
        setLoading(false)
        
      } catch (error) {
        console.error('❌ [AUTH] Erro inesperado:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Carregar usuário inicial
    loadInitialUser()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] Mudança de estado:', event, session?.user?.email || 'sem usuário')
        
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ [AUTH] Login detectado:', session.user.email)
          
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            subscription_plan: session.user.user_metadata?.subscription_plan || 'free',
            subscription_status: session.user.user_metadata?.subscription_status || 'inactive',
            credits_remaining: session.user.user_metadata?.credits_remaining ?? 10,
            updated_at: session.user.user_metadata?.updated_at,
            force_refresh: session.user.user_metadata?.force_refresh
          }
          
          setUser(userProfile)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 [AUTH] Logout detectado')
          setUser(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 [AUTH] Token atualizado:', session.user.email)
          
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            subscription_plan: session.user.user_metadata?.subscription_plan || 'free',
            subscription_status: session.user.user_metadata?.subscription_status || 'inactive',
            credits_remaining: session.user.user_metadata?.credits_remaining ?? 10,
            updated_at: session.user.user_metadata?.updated_at,
            force_refresh: session.user.user_metadata?.force_refresh
          }
          
          setUser(userProfile)
          setLoading(false)
        } else {
          // Para qualquer outro evento, garantir que loading seja false
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Polling para verificar mudanças após pagamentos
  useEffect(() => {
    if (!user) return

    const checkForUpdates = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const currentForceRefresh = authUser.user_metadata?.force_refresh || 0
        const currentUpdatedAt = authUser.user_metadata?.updated_at

        // Se houve mudança no force_refresh ou updated_at, atualizar
        if (currentForceRefresh > lastRefresh || 
            (currentUpdatedAt && currentUpdatedAt !== user.updated_at)) {
          
          console.log('🔄 [AUTH] Detectada mudança nos dados, atualizando...')
          setLastRefresh(currentForceRefresh)
          await refreshUser()
        }
      } catch (error) {
        console.error('❌ [AUTH] Erro no polling:', error)
      }
    }

    // Verificar a cada 3 segundos por 30 segundos após login
    const interval = setInterval(checkForUpdates, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [user, lastRefresh, refreshUser])

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

  const resetPassword = async (email: string) => {
    try {
      console.log(`🔑 [AUTH] Enviando email de recuperação para: ${email}`)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('❌ [AUTH] Erro ao enviar email de recuperação:', error)
        throw error
      }

      console.log('✅ [AUTH] Email de recuperação enviado com sucesso')
    } catch (error) {
      console.error('❌ [AUTH] Erro no resetPassword:', error)
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
    resetPassword,
    refreshUser
  }
} 