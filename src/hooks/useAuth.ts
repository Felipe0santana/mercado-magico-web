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
      if (isRefreshing && !forceRefresh) {
        console.log('⏳ [AUTH] Refresh já em andamento, ignorando...')
        return
      }

      setIsRefreshing(true)
      console.log('🔄 [AUTH] Atualizando dados do usuário...')
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
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

      // Verificar se houve mudanças nos metadados
      const newMetadataHash = generateMetadataHash(authUser.user_metadata)
      const hasChanges = newMetadataHash !== lastMetadataHash || forceRefresh

      if (hasChanges || !user) {
        console.log('🔄 [AUTH] Detectadas mudanças nos metadados ou primeira carga, atualizando...')
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

        console.log('✅ [AUTH] Usuário atualizado:', {
          email: userProfile.email,
          plan: userProfile.subscription_plan,
          credits: userProfile.credits_remaining === -1 ? 'ilimitados' : userProfile.credits_remaining,
          updated_at: userProfile.updated_at
        })

        setUser(userProfile)
        
        // Mostrar notificação de atualização se houve mudança de plano
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
      
      setLoading(false)
    } catch (error) {
      console.error('❌ [AUTH] Erro ao atualizar usuário:', error)
      setLoading(false)
    } finally {
      setIsRefreshing(false)
    }
  }, [lastMetadataHash, generateMetadataHash, user, isRefreshing])

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
          await refreshUser(true)
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 [AUTH] Logout detectado')
          setUser(null)
          setLoading(false)
          setLastMetadataHash('')
          
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 [AUTH] Token atualizado automaticamente:', session.user.email)
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
    }
  }, [refreshUser, generateMetadataHash])

  // Polling inteligente apenas após pagamentos (detectado por mudanças específicas)
  useEffect(() => {
    if (!user) return

    let checkInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    // Verificar se há indicação de pagamento recente
    const hasRecentPayment = user.force_refresh && 
      user.force_refresh > (Date.now() - 120000) // Últimos 2 minutos

    if (hasRecentPayment) {
      console.log('💳 [AUTH] Pagamento recente detectado, iniciando verificação automática...')
      
      let attempts = 0
      const maxAttempts = 30 // 30 tentativas = 1 minuto
      
      checkInterval = setInterval(async () => {
        attempts++
        console.log(`🔍 [AUTH] Verificação automática ${attempts}/${maxAttempts}...`)
        
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const newHash = generateMetadataHash(authUser.user_metadata)
            if (newHash !== lastMetadataHash) {
              console.log('✅ [AUTH] Mudança detectada via verificação automática!')
              await refreshUser(true)
              if (checkInterval) clearInterval(checkInterval)
              return
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Erro na verificação automática:', error)
        }
        
        if (attempts >= maxAttempts) {
          console.log('⏰ [AUTH] Verificação automática finalizada')
          if (checkInterval) clearInterval(checkInterval)
        }
      }, 2000) // A cada 2 segundos por 1 minuto
      
      // Timeout de segurança
      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval)
        console.log('⏰ [AUTH] Timeout da verificação automática')
      }, 120000) // 2 minutos máximo
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [user?.force_refresh, lastMetadataHash, refreshUser, generateMetadataHash])

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
      setLoading(true)
      console.log('👋 [AUTH] Fazendo logout...')
      
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
    } finally {
      setLoading(false)
    }
  }

  // Função para forçar refresh manual (para usar após pagamentos)
  const forceRefresh = useCallback(async () => {
    console.log('🔄 [AUTH] Refresh manual solicitado...')
    await refreshUser(true)
  }, [refreshUser])

  return {
    user,
    loading,
    isRefreshing,
    signIn,
    signUp,
    signOut,
    refreshUser: forceRefresh
  }
} 