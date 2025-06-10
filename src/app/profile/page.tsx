'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  ArrowLeft,
  LogOut,
  ShoppingCart,
  Package,
  Receipt,
  Zap,
  Edit,
  Shield,
  Trash2,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Crown,
  Star,
  RefreshCw,
  Settings,
  Activity
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  plan: string
  credits: number
  created_at: string
  last_activity: string
}

interface UserStats {
  lists_created: number
  items_added: number
  purchases_made: number
  total_spent: number
  ai_usage: number
  monthly_lists: number
  monthly_ai_usage: number
  avg_items_per_list: number
  favorite_feature: string
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loadingAction, setLoadingAction] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Estados para edição
  const [editForm, setEditForm] = useState({
    full_name: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Atualizar timestamp quando user muda
  useEffect(() => {
    if (user) {
      setLastUpdate(new Date())
      setEditForm({
        full_name: user.email?.split('@')[0] || ''
      })
    }
  }, [user])

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600'
      case 'plus': return 'text-blue-600'
      case 'pro': return 'text-purple-600'
      case 'premium': return 'text-orange-600'
      case 'super': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'plus': return 'bg-blue-100 text-blue-800'
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'premium': return 'bg-orange-100 text-orange-800'
      case 'super': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCredits = (credits: number) => {
    if (credits === -1) return 'Ilimitado'
    return credits.toLocaleString('pt-BR')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/pricing')}
                className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Perfil do Usuário */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              {/* Avatar */}
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              
              {/* Nome e Email */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {editForm.full_name || user.email?.split('@')[0] || 'admin6'}
              </h2>
              <p className="text-gray-600 text-sm mb-1">{user.email}</p>
              <p className="text-gray-500 text-xs mb-4">
                Membro desde {user.updated_at ? formatDate(user.updated_at) : '24/04/2025'}
              </p>

              {/* Badge do Plano */}
              <div className="mb-6">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(user.subscription_plan)}`}>
                  <Crown className="w-4 h-4" />
                  <span className="capitalize">{user.subscription_plan}</span>
                  <span className="text-green-600">✓ Ativo</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {formatCredits(user.credits_remaining)} créditos mensais
                </p>
              </div>

              {/* Créditos Disponíveis */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Créditos Disponíveis</span>
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCredits(user.credits_remaining)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total usado: 0<br />
                  Este mês: 0 usados
                </div>
              </div>
            </div>

            {/* Resumo de Atividade */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resumo de Atividade</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Listas criadas</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items adicionados</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Compras realizadas</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Funcionalidade favorita</span>
                  <span className="font-semibold text-green-600">Reconhecimento IA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Listas Criadas */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">+0 este mês</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Listas Criadas</div>
              </div>

              {/* Items Adicionados */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">~0 por lista</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Items Adicionados</div>
              </div>

              {/* Compras Realizadas */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Receipt className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">R$ 0,00 total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                <div className="text-sm text-gray-600">Compras Realizadas</div>
              </div>

              {/* IA Utilizada */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-500">0 este mês</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">1</div>
                <div className="text-sm text-gray-600">IA Utilizada</div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Seu nome completo"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900">{editForm.full_name || 'admin6'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{user.email}</span>
                      <span className="text-xs text-gray-500">(não editável)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membro desde
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">
                        {user.updated_at ? formatDate(user.updated_at) : '24/04/2025'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Última Atividade
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">07/05/2025</span>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center space-x-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      // Aqui você implementaria a lógica de salvar
                      setIsEditing(false)
                      setSuccess('Perfil atualizado com sucesso!')
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Segurança */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Alterar Senha</h3>
                    <p className="text-sm text-gray-600">Atualize sua senha para manter sua conta segura</p>
                  </div>
                  <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    Alterar
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Excluir Conta</h3>
                    <p className="text-sm text-gray-600">Remover permanentemente sua conta e dados</p>
                  </div>
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            </div>

            {/* Análise de Uso */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Análise de Uso</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Eficiência das Listas */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Eficiência das Listas</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Média de itens por lista</span>
                    <span className="font-semibold text-green-600">0</span>
                  </div>
                </div>

                {/* Funcionalidade Favorita */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Funcionalidade Favorita</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-600 font-medium">Reconhecimento IA</span>
                    <span className="text-sm text-gray-600">Mais utilizada</span>
                  </div>
                </div>

                {/* Atividade Mensal */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Atividade Mensal</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Listas criadas</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">IA utilizada</span>
                      <span className="font-semibold">0x</span>
                    </div>
                  </div>
                </div>

                {/* Economia Total */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Economia Total</h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">R$ 0,00</div>
                  <div className="text-sm text-gray-600">Gasto registrado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 