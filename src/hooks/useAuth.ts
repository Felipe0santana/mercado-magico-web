'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Erro inesperado ao obter sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Polling para verificar atualizações do usuário com frequência adaptativa
  useEffect(() => {
    if (!user) return

    let pollInterval = 10000 // Começar com 10 segundos
    let consecutiveNoChanges = 0
    
    const checkForUpdates = async () => {
      try {
        const { data: { user: updatedUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Erro ao verificar atualizações:', error)
          return
        }

        if (updatedUser) {
          // Verificar se houve mudanças significativas
          const hasChanges = 
            updatedUser.updated_at !== user.updated_at ||
            updatedUser.user_metadata?.subscription_plan !== user.user_metadata?.subscription_plan ||
            updatedUser.user_metadata?.credits_remaining !== user.user_metadata?.credits_remaining ||
            updatedUser.user_metadata?.subscription_status !== user.user_metadata?.subscription_status

          if (hasChanges) {
            console.log('🔄 Mudanças detectadas no usuário, atualizando...')
            console.log('📊 Plano:', updatedUser.user_metadata?.subscription_plan)
            console.log('💳 Créditos:', updatedUser.user_metadata?.credits_remaining)
            setUser(updatedUser)
            consecutiveNoChanges = 0
            pollInterval = 5000 // Acelerar polling após mudança
          } else {
            consecutiveNoChanges++
            // Desacelerar polling gradualmente se não há mudanças
            if (consecutiveNoChanges > 3) {
              pollInterval = Math.min(pollInterval * 1.5, 60000) // Máximo 1 minuto
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error)
      }
    }

    // Verificar imediatamente
    checkForUpdates()

    // Configurar polling dinâmico
    const interval = setInterval(checkForUpdates, pollInterval)

    return () => clearInterval(interval)
  }, [user])

  const refreshUser = async () => {
    try {
      console.log('🔄 Recarregando dados do usuário...')
      
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Erro ao recarregar usuário:', error)
        throw error
      }

      if (refreshedUser) {
        console.log('✅ Usuário recarregado:', refreshedUser.email)
        console.log('📊 Plano atual:', refreshedUser.user_metadata?.subscription_plan)
        console.log('💳 Créditos:', refreshedUser.user_metadata?.credits_remaining)
        setUser(refreshedUser)
      }
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.')
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Muitas tentativas. Tente novamente em alguns minutos.')
        } else {
          throw new Error('Erro ao fazer login. Tente novamente.')
        }
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_remaining: 10,
            total_credits_purchased: 0,
          }
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado')
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres')
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido')
        } else {
          throw new Error('Erro ao criar conta. Tente novamente.')
        }
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Erro ao enviar email de recuperação:', error)
        throw new Error('Erro ao enviar email de recuperação')
      }

      console.log('Email de recuperação enviado')
    } catch (error) {
      console.error('Erro inesperado ao enviar email:', error)
      throw error
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser
  }
} 