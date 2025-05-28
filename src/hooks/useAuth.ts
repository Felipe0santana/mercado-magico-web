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
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('Tentando login com Supabase...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        console.error('Erro de login:', error)
        return { error }
      }

      console.log('Login bem-sucedido:', data.user?.email)
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no login:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      console.log('Tentando criar conta...')
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('Erro ao criar conta:', error)
        return { error }
      }

      if (data.user && !error) {
        console.log('Usuário criado, criando perfil...')
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            subscription_status: 'free',
            subscription_plan: 'free',
            credits_remaining: 10,
            total_credits_purchased: 0
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        } else {
          console.log('Perfil criado com sucesso')
        }
      }

      console.log('Conta criada com sucesso:', data.user?.email)
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado ao criar conta:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro ao fazer logout:', error)
        return { error }
      }

      console.log('Logout realizado com sucesso')
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no logout:', error)
      return { error }
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
        return { error }
      }

      console.log('Email de recuperação enviado')
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado ao enviar email:', error)
      return { error }
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
} 