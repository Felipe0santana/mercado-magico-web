'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Settings, 
  CreditCard, 
  History, 
  LogOut, 
  Edit3, 
  Save, 
  X, 
  Shield, 
  Mail, 
  Calendar,
  Star,
  Zap,
  Crown,
  Award,
  Loader2,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import DeleteAccountModal from '@/components/DeleteAccountModal'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  name?: string
  avatar_url?: string
  subscription_status?: string
  subscription_plan?: string
  credits_remaining?: number
  total_credits_purchased?: number
  created_at: string
  updated_at: string
}

interface UserStats {
  totalShoppingLists: number
  totalShoppingItems: number
  totalPurchases: number
  totalCreditTransactions: number
  averageListSize: number
  lastActivity: string
  mostUsedFeature: string
  totalSpent: number
  creditsUsedThisMonth: number
  listsCreatedThisMonth: number
}

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: ''
  })

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Carregar perfil do usuário
  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadUserStats()
    }
  }, [user])

  // Adicionar listener para mudanças em tempo real
  useEffect(() => {
    if (user?.id) {
      const subscription = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔄 Perfil atualizado em tempo real:', payload.new)
            setProfile(payload.new as UserProfile)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.id])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando perfil do usuário...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }

      console.log('✅ Perfil carregado:', data)
      setProfile(data)
      setEditForm({
        full_name: data.full_name || '',
        email: data.email || ''
      })
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    try {
      setRefreshing(true)
      console.log('🔄 Atualizando perfil manualmente...')
      
      await loadUserProfile()
      await loadUserStats()
      
      console.log('✅ Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const userId = user?.id
      if (!userId) return

      // Buscar estatísticas das diferentes tabelas
      const [
        { data: shoppingLists, error: listsError },
        { data: shoppingItems, error: itemsError },
        { data: purchases, error: purchasesError },
        { data: creditTransactions, error: creditsError }
      ] = await Promise.all([
        supabase.from('shopping_lists').select('*').eq('user_id', userId),
        supabase.from('shopping_items').select('*').eq('user_id', userId),
        supabase.from('purchase_history').select('*').eq('user_id', userId),
        supabase.from('credit_transactions').select('*').eq('user_id', userId)
      ])

      if (listsError) console.error('Erro ao carregar listas:', listsError)
      if (itemsError) console.error('Erro ao carregar itens:', itemsError)
      if (purchasesError) console.error('Erro ao carregar compras:', purchasesError)
      if (creditsError) console.error('Erro ao carregar créditos:', creditsError)

      // Calcular estatísticas
      const totalShoppingLists = shoppingLists?.length || 0
      const totalShoppingItems = shoppingItems?.length || 0
      const totalPurchases = purchases?.length || 0
      const totalCreditTransactions = creditTransactions?.length || 0

      // Calcular média de itens por lista
      const averageListSize = totalShoppingLists > 0 ? Math.round(totalShoppingItems / totalShoppingLists) : 0

      // Calcular total gasto
      const totalSpent = purchases?.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0) || 0

      // Calcular atividade do mês atual
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const creditsUsedThisMonth = creditTransactions?.filter(transaction => {
        const transactionDate = new Date(transaction.created_at)
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               transaction.transaction_type === 'debit'
      }).length || 0

      const listsCreatedThisMonth = shoppingLists?.filter(list => {
        const listDate = new Date(list.created_at)
        return listDate.getMonth() === currentMonth && listDate.getFullYear() === currentYear
      }).length || 0

      // Última atividade
      const allActivities = [
        ...(shoppingLists || []).map(item => ({ date: item.created_at, type: 'lista' })),
        ...(purchases || []).map(item => ({ date: item.created_at, type: 'compra' })),
        ...(creditTransactions || []).map(item => ({ date: item.created_at, type: 'crédito' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const lastActivity = allActivities[0]?.date || profile?.created_at || ''

      // Funcionalidade mais usada (baseado em transações de crédito)
      const featureUsage = creditTransactions?.reduce((acc, transaction) => {
        const feature = transaction.description || 'Reconhecimento IA'
        acc[feature] = (acc[feature] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const mostUsedFeature = Object.keys(featureUsage).length > 0 
        ? Object.entries(featureUsage).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
        : 'Reconhecimento IA'

      setStats({
        totalShoppingLists,
        totalShoppingItems,
        totalPurchases,
        totalCreditTransactions,
        averageListSize,
        lastActivity,
        mostUsedFeature,
        totalSpent,
        creditsUsedThisMonth,
        listsCreatedThisMonth
      })

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditForm({
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) {
        console.error('Erro ao salvar perfil:', error)
        alert('Erro ao salvar alterações')
        return
      }

      // Atualizar estado local
      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        updated_at: new Date().toISOString()
      } : null)

      setEditing(false)
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut()
      router.push('/')
    }
  }

  const getPlanIcon = (plan?: string) => {
    switch (plan) {
      case 'free': return <Zap className="w-5 h-5 text-green-400" />
      case 'plus': return <Star className="w-5 h-5 text-blue-400" />
      case 'pro': return <Crown className="w-5 h-5 text-purple-400" />
      case 'premium': return <Award className="w-5 h-5 text-yellow-400" />
      default: return <Zap className="w-5 h-5 text-gray-400" />
    }
  }

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'free': return 'text-green-400 bg-green-500/20 border-green-500'
      case 'plus': return 'text-blue-400 bg-blue-500/20 border-blue-500'
      case 'pro': return 'text-purple-400 bg-purple-500/20 border-purple-500'
      case 'premium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500'
    }
  }

  const getPlanName = (plan?: string) => {
    switch (plan) {
      case 'free': return 'Gratuito'
      case 'plus': return 'Plus'
      case 'pro': return 'Pro'
      case 'premium': return 'Premium'
      default: return 'Gratuito'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'inactive': return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-400" />
      default: return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'inactive': return 'Inativo'
      case 'pending': return 'Pendente'
      default: return 'Desconhecido'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Erro ao carregar perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Voltar
              </button>
              <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshProfile}
                disabled={refreshing}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              >
                {refreshing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
                <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Informações do Usuário */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.full_name || profile.name || 'Usuário'}</h2>
                <p className="text-gray-400 text-sm">{profile.email}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Status da Assinatura */}
              <div className={`rounded-lg p-4 border ${getPlanColor(profile.subscription_plan)} mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getPlanIcon(profile.subscription_plan)}
                    <span className="font-semibold">{getPlanName(profile.subscription_plan)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(profile.subscription_status)}
                    <span className="text-xs">{getStatusText(profile.subscription_status)}</span>
                  </div>
                </div>
                <p className="text-xs opacity-80">
                  {profile.subscription_plan === 'premium' ? 'Acesso completo sem limites' : 
                   profile.subscription_plan === 'pro' ? '200 créditos mensais' :
                   profile.subscription_plan === 'plus' ? '50 créditos mensais' :
                   '10 créditos mensais'}
                </p>
              </div>

              {/* Créditos */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Créditos Disponíveis</span>
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {profile.subscription_plan === 'premium' ? '∞' : (profile.credits_remaining || 0)}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Total usado: {profile.total_credits_purchased || 0}</p>
                  {stats && (
                    <p>Este mês: {stats.creditsUsedThisMonth} usados</p>
                  )}
                </div>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            {stats && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Resumo de Atividade</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Listas criadas</span>
                    <span className="text-white font-medium">{stats.totalShoppingLists}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Itens adicionados</span>
                    <span className="text-white font-medium">{stats.totalShoppingItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Compras realizadas</span>
                    <span className="text-white font-medium">{stats.totalPurchases}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Funcionalidade favorita</span>
                    <span className="text-green-400 font-medium text-xs">{stats.mostUsedFeature}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Estatísticas Detalhadas */}
            {stats && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold text-white">{stats.totalShoppingLists}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Listas Criadas</p>
                  <p className="text-green-400 text-xs">+{stats.listsCreatedThisMonth} este mês</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{stats.totalShoppingItems}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Itens Adicionados</p>
                  <p className="text-blue-400 text-xs">~{stats.averageListSize} por lista</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="w-8 h-8 text-green-400" />
                    <span className="text-2xl font-bold text-white">{stats.totalPurchases}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Compras Realizadas</p>
                  <p className="text-green-400 text-xs">R$ {stats.totalSpent.toFixed(2)} total</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">{stats.totalCreditTransactions}</span>
                  </div>
                  <p className="text-gray-400 text-sm">IA Utilizada</p>
                  <p className="text-yellow-400 text-xs">{stats.creditsUsedThisMonth} este mês</p>
                </div>
              </div>
            )}

            {/* Informações Pessoais */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Settings className="w-6 h-6" />
                  <span>Informações Pessoais</span>
                </h3>
                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                      placeholder="Seu nome completo"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{profile.full_name || profile.name || 'Não informado'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{profile.email}</span>
                    <span className="text-xs text-gray-400">(não editável)</span>
                  </div>
                </div>

                {/* Data de Criação */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Membro desde
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-white">
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Última Atividade */}
                {stats && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Última Atividade
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-white">
                        {new Date(stats.lastActivity).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              {editing && (
                <div className="flex space-x-4 pt-6 mt-6 border-t border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Configurações de Segurança */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6" />
                <span>Segurança</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">Alterar Senha</h4>
                    <p className="text-sm text-gray-400">Atualize sua senha para manter sua conta segura</p>
                  </div>
                  <button
                    onClick={() => setChangePasswordModalOpen(true)}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    Alterar
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">Excluir Conta</h4>
                    <p className="text-sm text-gray-400">Remover permanentemente sua conta e dados</p>
                  </div>
                  <button
                    onClick={() => setDeleteAccountModalOpen(true)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>

            {/* Análise de Uso */}
            {stats && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2 mb-6">
                  <BarChart3 className="w-6 h-6" />
                  <span>Análise de Uso</span>
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Eficiência das Listas</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Média de itens por lista</span>
                        <span className="text-green-400 font-bold">{stats.averageListSize}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${Math.min((stats.averageListSize / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Atividade Mensal</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Listas criadas</span>
                          <span className="text-blue-400">{stats.listsCreatedThisMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">IA utilizada</span>
                          <span className="text-yellow-400">{stats.creditsUsedThisMonth}x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Funcionalidade Favorita</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          {stats.mostUsedFeature}
                        </div>
                        <p className="text-gray-400 text-sm">Mais utilizada</p>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Economia Total</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          R$ {stats.totalSpent.toFixed(2)}
                        </div>
                        <p className="text-gray-400 text-sm">Gasto registrado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 