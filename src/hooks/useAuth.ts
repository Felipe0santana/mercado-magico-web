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
  force_refresh?: number
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const [lastMetadataHash, setLastMetadataHash] = useState<string>('')

  // Função para gerar hash dos metadados para detectar mudanças
  const generateMetadataHash = useCallback((metadata: any) => {
    const relevantData = {
      subscription_plan: metadata?.subscription_plan,
      credits_remaining: metadata?.credits_remaining,
      updated_at: metadata?.updated_at,
      force_refresh: metadata?.force_refresh
    }
    return JSON.stringify(relevantData)
  }, [])

  const refreshUser = useCallback(async (forceRefresh = false) => {
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

      // Verificar se houve mudanças nos metadados
      const newMetadataHash = generateMetadataHash(authUser.user_metadata)
      const hasChanges = newMetadataHash !== lastMetadataHash || forceRefresh

      if (hasChanges) {
        console.log('🔄 [AUTH] Detectadas mudanças nos metadados, atualizando...')
        setLastMetadataHash(newMetadataHash)

        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          subscription_plan: authUser.user_metadata?.subscription_plan || 'free',
          subscription_status: authUser.user_metadata?.subscription_status || 'inactive',
          credits_remaining: authUser.user_metadata?.credits_remaining ?? 10,
          updated_at: authUser.user_metadata?.updated_at,
          force_refresh: authUser.user_metadata?.force_refresh
        }

        console.log('✅ [AUTH] Usuário atualizado automaticamente:', {
          email: userProfile.email,
          plan: userProfile.subscription_plan,
          credits: userProfile.credits_remaining === -1 ? 'ilimitados' : userProfile.credits_remaining,
          updated_at: userProfile.updated_at
        })

        setUser(userProfile)
        
        // Mostrar notificação de atualização se não for a primeira carga
        if (user && user.subscription_plan !== userProfile.subscription_plan) {
          console.log(`🎉 [AUTH] Plano atualizado: ${user.subscription_plan} → ${userProfile.subscription_plan}`)
          
          // Mostrar notificação no browser se possível
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Plano Atualizado!', {
              body: `Seu plano foi atualizado para ${userProfile.subscription_plan}`,
              icon: '/favicon.ico'
            })
          }
        }
      } else {
        console.log('ℹ️ [AUTH] Nenhuma mudança detectada nos metadados')
      }
    } catch (error) {
      console.error('❌ [AUTH] Erro ao atualizar usuário:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [lastMetadataHash, generateMetadataHash, user])

  // Inicialização e listener de auth
  useEffect(() => {
    console.log('🚀 [AUTH] Inicializando useAuth com sistema automático...')
    
    let mounted = true
    let pollingInterval: NodeJS.Timeout | null = null
    
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
        
        // Inicializar hash dos metadados
        const initialHash = generateMetadataHash(authUser.user_metadata)
        setLastMetadataHash(initialHash)
        
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
        
        // Solicitar permissão para notificações
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            console.log(`🔔 [AUTH] Permissão de notificação: ${permission}`)
          })
        }
        
        // Iniciar polling automático para detectar mudanças
        console.log('🔄 [AUTH] Iniciando polling automático...')
        pollingInterval = setInterval(async () => {
          if (mounted) {
            await refreshUser()
          }
        }, 2000) // Verificar a cada 2 segundos
        
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
          
          // Inicializar hash dos metadados
          const initialHash = generateMetadataHash(session.user.user_metadata)
          setLastMetadataHash(initialHash)
          
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
          
          // Iniciar polling automático após login
          if (pollingInterval) clearInterval(pollingInterval)
          pollingInterval = setInterval(async () => {
            if (mounted) {
              await refreshUser()
            }
          }, 2000)
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 [AUTH] Logout detectado')
          setUser(null)
          setLoading(false)
          setLastMetadataHash('')
          
          // Parar polling após logout
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
          
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 [AUTH] Token atualizado automaticamente:', session.user.email)
          
          // Verificar mudanças após refresh do token
          await refreshUser()
          
        } else {
          // Para qualquer outro evento, garantir que loading seja false
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [refreshUser, generateMetadataHash])

  // Polling inteligente para verificar mudanças após pagamentos
  useEffect(() => {
    if (!user) return

    let intensivePollingTimeout: NodeJS.Timeout | null = null

    const checkForUpdates = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const currentForceRefresh = authUser.user_metadata?.force_refresh || 0
        const currentUpdatedAt = authUser.user_metadata?.updated_at

        // Se houve mudança no force_refresh ou updated_at, atualizar
        if (currentForceRefresh > lastRefresh || 
            (currentUpdatedAt && currentUpdatedAt !== user.updated_at)) {
          
          console.log('🔄 [AUTH] Detectada mudança via polling intensivo, atualizando...')
          setLastRefresh(currentForceRefresh)
          await refreshUser(true)
        }
      } catch (error) {
        console.error('❌ [AUTH] Erro no polling intensivo:', error)
      }
    }

    // Polling intensivo por 60 segundos após login/mudança
    console.log('🚀 [AUTH] Iniciando polling intensivo por 60 segundos...')
    const intensiveInterval = setInterval(checkForUpdates, 1000) // A cada 1 segundo
    intensivePollingTimeout = setTimeout(() => {
      clearInterval(intensiveInterval)
      console.log('⏰ [AUTH] Polling intensivo finalizado')
    }, 60000) // Por 60 segundos

    return () => {
      clearInterval(intensiveInterval)
      if (intensivePollingTimeout) {
        clearTimeout(intensivePollingTimeout)
      }
    }
  }, [user?.id, lastRefresh, refreshUser])

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
      setLastMetadataHash('')
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
    refreshUser: () => refreshUser(true)
  }
} 