import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase (mesmo projeto do app mobile)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cklmyduznlathpeoczjv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jempWIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODAzNywiZXhwIjoyMDUwODU2Mzd9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jempWIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODAzNywiZXhwIjoyMDUwODU2Mzd9'

// Cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas principais
export interface User {
  id: string
  email: string
  name?: string
  subscription_plan?: 'free' | 'plus' | 'pro' | 'premium'
  subscription_status?: 'active' | 'inactive' | 'canceled'
  credits_remaining?: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'plus' | 'pro' | 'premium'
  status: 'active' | 'inactive' | 'canceled'
  stripe_subscription_id?: string
  stripe_customer_id?: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export interface CreditUsage {
  id: string
  user_id: string
  feature_type: 'photo_recognition' | 'nutrition_analysis' | 'handwritten_list' | 'price_comparison'
  credits_used: number
  created_at: string
}

// Funções utilitárias para autenticação
export const auth = {
  // Fazer login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Registrar novo usuário
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    })
    return { data, error }
  },

  // Fazer logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Obter sessão atual
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },
}

// Funções para gerenciar usuários
export const users = {
  // Criar perfil de usuário
  createProfile: async (userId: string, userData: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          ...userData,
        },
      ])
      .select()
    return { data, error }
  },

  // Obter perfil do usuário
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Atualizar perfil do usuário
  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  },

  // Atualizar plano de assinatura
  updateSubscriptionPlan: async (userId: string, plan: string, status: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
    return { data, error }
  },
}

// Funções para gerenciar assinaturas
export const subscriptions = {
  // Criar nova assinatura
  create: async (subscriptionData: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
    return { data, error }
  },

  // Obter assinatura do usuário
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    return { data, error }
  },

  // Atualizar assinatura
  update: async (subscriptionId: string, updates: Partial<Subscription>) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
    return { data, error }
  },

  // Cancelar assinatura
  cancel: async (subscriptionId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
    return { data, error }
  },
}

// Funções para gerenciar uso de créditos
export const credits = {
  // Registrar uso de crédito
  recordUsage: async (userId: string, featureType: string, creditsUsed: number = 1) => {
    const { data, error } = await supabase
      .from('credit_usage')
      .insert([
        {
          user_id: userId,
          feature_type: featureType,
          credits_used: creditsUsed,
        },
      ])
      .select()
    return { data, error }
  },

  // Obter uso de créditos do mês atual
  getMonthlyUsage: async (userId: string) => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    return { data, error }
  },

  // Obter total de créditos usados no mês
  getMonthlyTotal: async (userId: string) => {
    const { data, error } = await credits.getMonthlyUsage(userId)
    if (error) return { total: 0, error }
    
    const total = data?.reduce((sum, usage) => sum + usage.credits_used, 0) || 0
    return { total, error: null }
  },
}

export default supabase 