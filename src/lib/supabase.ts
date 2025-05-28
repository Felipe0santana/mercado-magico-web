import { createClient } from '@supabase/supabase-js'

// Configurações corretas do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cklmyduznlathpeoczjv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbG15ZHV6bmxhdGhwZW9jemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTkwMzIsImV4cCI6MjA2MDI5NTAzMn0.Rp4ndKYkr-N7q9Hio8XnGqEl_3d-8Qpo2o91Yhi0gvI'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente Supabase público
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente Supabase admin (para operações administrativas)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

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
  full_name?: string
  avatar_url?: string
  total_credits_purchased?: number
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

export interface PurchaseHistory {
  id: string
  user_id: string
  shopping_list_id?: string
  total_amount: number
  store_name?: string
  purchase_date: string
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
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Obter sessão atual
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Resetar senha
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },
}

// Funções para gerenciar usuários usando apenas auth.users
export const users = {
  // Buscar usuário por email usando auth.users
  getByEmail: async (email: string) => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return null
      }

      const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        console.error('Erro ao buscar usuários:', error)
        return null
      }
      
      const user = authUsers?.users?.find(u => u.email === email)
      return user || null
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error)
      return null
    }
  },

  // Obter perfil do usuário usando auth.users
  getProfile: async (userId: string) => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return { data: null, error: 'Cliente admin não configurado' }
      }

      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (error) {
        console.error('Erro ao buscar perfil:', error)
        return { data: null, error }
      }

      // Extrair dados do user_metadata
      const profile = {
        id: user.user?.id,
        email: user.user?.email,
        full_name: user.user?.user_metadata?.full_name || user.user?.email?.split('@')[0],
        subscription_plan: user.user?.user_metadata?.subscription_plan || 'free',
        subscription_status: user.user?.user_metadata?.subscription_status || 'active',
        credits_remaining: user.user?.user_metadata?.credits_remaining || 10,
        total_credits_purchased: user.user?.user_metadata?.total_credits_purchased || 0,
        created_at: user.user?.created_at,
        updated_at: user.user?.updated_at
      }
      
      return { data: profile, error: null }
    } catch (error) {
      console.error('Erro ao obter perfil:', error)
      return { data: null, error }
    }
  },

  // Atualizar perfil do usuário usando auth.users metadata
  updateProfile: async (userId: string, updates: any) => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return { data: null, error: 'Cliente admin não configurado' }
      }

      // Buscar dados atuais
      const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (fetchError || !currentUser.user) {
        console.error('Erro ao buscar usuário atual:', fetchError)
        return { data: null, error: fetchError }
      }

      // Mesclar com dados existentes
      const currentMetadata = currentUser.user.user_metadata || {}
      const newMetadata = {
        ...currentMetadata,
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Atualizar user_metadata
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: newMetadata
      })
      
      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { data: null, error }
      }
      
      return { data: data.user, error: null }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { data: null, error }
    }
  },

  // Atualizar plano de assinatura por email
  updatePlanByEmail: async (email: string, plan: string, credits: number) => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return null
      }

      console.log(`🔄 Atualizando plano para ${email}: ${plan} com ${credits} créditos`)
      
      // Buscar usuário por email
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('Erro ao listar usuários:', listError)
        return null
      }
      
      const user = authUsers?.users?.find(u => u.email === email)
      
      if (!user) {
        console.error(`Usuário não encontrado: ${email}`)
        return null
      }

      // Atualizar user_metadata
      const currentMetadata = user.user_metadata || {}
      const newMetadata = {
        ...currentMetadata,
        subscription_plan: plan,
        subscription_status: 'active',
        credits_remaining: credits,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: newMetadata
      })
      
      if (error) {
        console.error('Erro ao atualizar plano:', error)
        return null
      }
      
      console.log(`✅ Plano atualizado com sucesso para ${email}`)
      return data.user
    } catch (error) {
      console.error('Erro ao atualizar plano por email:', error)
      return null
    }
  },

  // Atualizar plano de assinatura por ID
  updateSubscriptionPlan: async (userId: string, plan: string, status: string) => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return { data: null, error: 'Cliente admin não configurado' }
      }

      // Buscar dados atuais
      const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (fetchError || !currentUser.user) {
        console.error('Erro ao buscar usuário:', fetchError)
        return { data: null, error: fetchError }
      }

      // Atualizar metadata
      const currentMetadata = currentUser.user.user_metadata || {}
      const newMetadata = {
        ...currentMetadata,
        subscription_plan: plan,
        subscription_status: status,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: newMetadata
      })
      
      return { data: data?.user, error }
    } catch (error) {
      console.error('Erro ao atualizar subscription:', error)
      return { data: null, error }
    }
  },

  // Listar todos os usuários
  listAll: async () => {
    try {
      if (!supabaseAdmin) {
        console.error('❌ Cliente admin não configurado - SUPABASE_SERVICE_ROLE_KEY necessária')
        return { data: [], error: 'Cliente admin não configurado' }
      }

      const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        console.error('Erro ao listar usuários:', error)
        return { data: [], error }
      }
      
      const users = authUsers?.users?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        subscription_plan: user.user_metadata?.subscription_plan || 'free',
        subscription_status: user.user_metadata?.subscription_status || 'active',
        credits_remaining: user.user_metadata?.credits_remaining || 10,
        created_at: user.created_at,
        updated_at: user.updated_at
      })) || []
      
      return { data: users, error: null }
    } catch (error) {
      console.error('Erro ao listar usuários:', error)
      return { data: [], error }
    }
  }
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

  // Obter assinatura por usuário
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
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
}

// Funções para histórico de compras
export const purchaseHistory = {
  // Criar registro de compra
  create: async (purchaseData: Omit<PurchaseHistory, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('purchase_history')
      .insert([purchaseData])
      .select()
    return { data, error }
  },

  // Obter histórico por usuário
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('purchase_history')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
    return { data, error }
  },
}

// Funções para uso de créditos
export const creditUsage = {
  // Registrar uso de crédito
  create: async (usageData: Omit<CreditUsage, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('credit_usage')
      .insert([usageData])
      .select()
    return { data, error }
  },

  // Obter uso por usuário
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },
}

// Função para definir créditos baseado no plano
export function getCreditsByPlan(plan: string): number {
  switch (plan.toLowerCase()) {
    case 'free':
      return 10
    case 'plus':
      return 50
    case 'pro':
      return 200
    case 'premium':
      return -1 // ilimitado
    default:
      return 10
  }
}

// Função para mapear valores do Stripe para planos
export function mapStripeAmountToPlan(amount: number): { plan: string; credits: number } {
  switch (amount) {
    case 999: // R$ 9,99 - Plus
      return { plan: 'plus', credits: 50 }
    case 2999: // R$ 29,99 - Pro  
      return { plan: 'pro', credits: 200 }
    case 9999: // R$ 99,99 - Premium
      return { plan: 'premium', credits: -1 } // Ilimitado
    default:
      console.warn(`⚠️ Valor não reconhecido: ${amount}`)
      return { plan: 'free', credits: 10 }
  }
}

export async function updateUserPlan(email: string, plan: string, creditsToAdd: number = -1) {
  try {
    console.log(`🔄 Atualizando plano do usuário ${email} para ${plan}`)

    if (!supabaseAdmin) {
      throw new Error('Cliente admin não configurado')
    }

    // Definir créditos baseado no plano se não especificado
    if (creditsToAdd === -1) {
      switch (plan) {
        case 'free':
          creditsToAdd = 10
          break
        case 'plus':
          creditsToAdd = 50
          break
        case 'pro':
          creditsToAdd = 200
          break
        case 'premium':
          creditsToAdd = -1 // Ilimitado
          break
        default:
          creditsToAdd = 10
      }
    }

    // ... existing code ...
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return null
  }
}

export default supabase 