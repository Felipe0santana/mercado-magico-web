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

  // Sistema DEFINITIVO de detecção automática
  useEffect(() => {
    console.log('🚀 [AUTH] Inicializando sistema DEFINITIVO de detecção automática')
    
    // Buscar usuário inicial
    fetchUser()

    // 1. LISTENER PRINCIPAL - Auth State Changes (detecta mudanças no user_metadata)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AUTH] Evento: ${event}`, {
          email: session?.user?.email || 'sem usuário',
          metadata: session?.user?.user_metadata
        })
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = convertUserData(session.user)
          setUser(userData)
          setLoading(false)
          console.log('🎉 [AUTH] Login automático detectado:', userData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          console.log('👋 [AUTH] Logout automático detectado')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userData = convertUserData(session.user)
          setUser(userData)
          console.log('🔄 [AUTH] Token atualizado automaticamente:', userData)
        } else if (event === 'USER_UPDATED' && session?.user) {
          const userData = convertUserData(session.user)
          setUser(userData)
          console.log('✨ [AUTH] Usuário atualizado automaticamente via webhook:', userData)
        }
      }
    )

    // 2. REALTIME LISTENER - Escuta mudanças na tabela auth.users (experimental)
    let realtimeChannel: any = null
    
    const setupRealtimeListener = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (currentUser) {
          console.log(`🔴 [AUTH] Configurando Realtime para usuário: ${currentUser.id}`)
          
          // Escutar mudanças na tabela auth.users (se disponível)
          realtimeChannel = supabase
            .channel(`user-updates-${currentUser.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'auth',
                table: 'users',
                filter: `id=eq.${currentUser.id}`
              },
              (payload) => {
                console.log('🔴 [AUTH] Mudança detectada via Realtime:', payload)
                // Recarregar dados do usuário
                setTimeout(() => {
                  fetchUser()
                }, 500)
              }
            )
            .subscribe((status) => {
              console.log(`🔴 [AUTH] Status do Realtime: ${status}`)
            })
        }
      } catch (error) {
        console.log('ℹ️ [AUTH] Realtime não disponível para auth.users (normal):', error)
      }
    }

    // Configurar Realtime após login
    setupRealtimeListener()

    // 3. DETECÇÃO DE FOCO/VISIBILIDADE - Para quando volta do Stripe
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [AUTH] Página visível - verificando atualizações')
        setTimeout(() => {
          fetchUser()
        }, 1000) // Aguarda 1 segundo para garantir que o webhook processou
      }
    }

    const handleFocus = () => {
      console.log('🎯 [AUTH] Janela em foco - verificando atualizações')
      setTimeout(() => {
        fetchUser()
      }, 1000)
    }

    // 4. POLLING INTELIGENTE - Apenas quando necessário
    let pollingInterval: NodeJS.Timeout | null = null
    let lastMetadataHash = ''

    const startIntelligentPolling = () => {
      // Polling apenas se houver usuário logado
      pollingInterval = setInterval(async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          if (currentUser) {
            const metadataString = JSON.stringify(currentUser.user_metadata || {})
            const currentHash = btoa(metadataString) // Hash simples
            
            if (currentHash !== lastMetadataHash) {
              console.log('🔄 [AUTH] Mudança detectada via polling inteligente')
              const userData = convertUserData(currentUser)
              setUser(userData)
              lastMetadataHash = currentHash
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Erro no polling:', error)
        }
      }, 3000) // Polling a cada 3 segundos (mais conservador)
    }

    // Iniciar polling inteligente
    startIntelligentPolling()

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      console.log('🧹 [AUTH] Limpando todos os listeners')
      
      // Limpar auth subscription
      subscription.unsubscribe()
      
      // Limpar realtime
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
      
      // Limpar polling
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      
      // Limpar event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchUser, convertUserData])

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
} 