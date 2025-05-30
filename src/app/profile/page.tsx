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
  RefreshCw
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

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Package className="w-5 h-5" />
      case 'plus': return <Star className="w-5 h-5" />
      case 'pro': return <Crown className="w-5 h-5" />
      case 'premium': return <Zap className="w-5 h-5" />
      case 'super': return <TrendingUp className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const formatCredits = (credits: number) => {
    if (credits === -1) return 'Ilimitado'
    return credits.toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
                <p className="text-sm text-gray-500">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Usuário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Usuário
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-mono text-sm">{user.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plano e Créditos - TEMPO REAL */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Plano e Créditos</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualização automática</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plano Atual */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`${getPlanColor(user.subscription_plan)}`}>
                      {getPlanIcon(user.subscription_plan)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Plano Atual</h3>
                      <p className={`text-lg font-bold capitalize ${getPlanColor(user.subscription_plan)}`}>
                        {user.subscription_plan}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium text-green-600">{user.subscription_status}</span>
                  </div>
                </div>

                {/* Créditos */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center space-x-3 mb-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Créditos</h3>
                      <p className="text-lg font-bold text-yellow-600">
                        {formatCredits(user.credits_remaining)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.credits_remaining === -1 ? 'Uso ilimitado' : 'Créditos disponíveis'}
                  </div>
                </div>
              </div>

              {/* Debug Info - Apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Debug Info</h4>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/pricing')}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Crown className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Alterar Plano</span>
                </button>
                
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Alterar Senha</span>
                </button>
                
                <button
                  onClick={() => setIsDeletingAccount(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">Deletar Conta</span>
                </button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Membro desde</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Última atualização</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {lastUpdate.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 