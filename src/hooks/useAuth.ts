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
      console.log('Criando conta via API personalizada...')
      
      // Usar API personalizada que funciona com função SQL
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          fullName: fullName
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Conta criada com sucesso!')
        return { error: null }
      } else {
        console.error('❌ Erro no cadastro:', result.error)
        
        // Tratar diferentes tipos de erro
        let errorMessage = result.error
        if (result.details?.message?.includes('duplicate key')) {
          errorMessage = 'Este email já está em uso'
        } else if (result.details?.message?.includes('invalid email')) {
          errorMessage = 'Email inválido'
        }
        
        return { error: new Error(errorMessage) }
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao criar conta:', error)
      return { error: new Error('Erro de conexão. Tente novamente.') }
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